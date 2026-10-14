import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { Address, Hash } from "viem";
import { isTestnet, networkLabel } from "@/config/chain";
import { getOffering, type Offering } from "@/config/offerings";
import { liveOffering } from "./offeringMeta";
import { checkTransfer, isEligible } from "./chainServer";
import type { Intent } from "./intentTypes";
import { quoteFor } from "./quote";
import { assertTransition } from "./stateMachine";
import type { CheckoutState } from "./states";
import { verifyOffering } from "./verify";

const INTENT_TTL_MS = 30 * 60 * 1000;
const STORE = path.resolve(process.cwd(), process.env.TRUVA_INTENT_STORE || ".data/intents.json");

export class CheckoutError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

// ---------- store: a JSON file, serialised through one in-process queue ----------

let queue: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function readAll(): Promise<Intent[]> {
  try {
    return JSON.parse(await fs.readFile(STORE, "utf8")) as Intent[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function writeAll(intents: Intent[]): Promise<void> {
  await fs.mkdir(path.dirname(STORE), { recursive: true });
  const tmp = `${STORE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(intents, null, 1));
  await fs.rename(tmp, STORE);
}

function newId(): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = randomBytes(8);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `TRV-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

function move(intent: Intent, to: CheckoutState, note: string | null = intent.note): void {
  assertTransition(intent.state, to);
  const at = new Date().toISOString();
  intent.state = to;
  intent.updatedAt = at;
  intent.history.push({ state: to, at });
  intent.note = note;
}

// ---------- reads ----------

export async function listIntents(filter?: { buyer?: string }): Promise<Intent[]> {
  const all = await readAll();
  const buyer = filter?.buyer?.toLowerCase();
  return all
    .filter((i) => !buyer || i.buyer.toLowerCase() === buyer)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getIntent(id: string): Promise<Intent | null> {
  return (await readAll()).find((i) => i.id === id) ?? null;
}

// ---------- create ----------

export async function createIntent(input: { offeringId: string; buyer: Address; amount: string }): Promise<Intent> {
  const offering = await liveOffering(input.offeringId);
  if (!offering) throw new CheckoutError("That offering doesn’t exist.", 404);
  if (offering.status !== "Active" && offering.status !== "Demo") {
    throw new CheckoutError("Checkout is closed for this offering.", 409);
  }

  const config = await verifyOffering(offering);
  if (!config.ok) {
    throw new CheckoutError(`Configuration could not be verified against ${networkLabel}. Checkout is closed.`, 409);
  }

  const quote = quoteFor(offering, input.amount);
  if (!quote.ok) throw new CheckoutError(quote.reason);

  // Re-check eligibility on the server immediately before creating the intent (PRD §8).
  const eligible = await isEligible(offering.suite.identityRegistry, input.buyer);
  if (eligible === null) throw new CheckoutError("Eligibility could not be verified, so checkout stays closed.", 503);
  if (!eligible) throw new CheckoutError("This wallet is not registered as eligible for this offering.", 403);

  const now = new Date();
  const at = now.toISOString();
  const intent: Intent = {
    id: newId(),
    offeringId: offering.id,
    offeringName: offering.name,
    buyer: input.buyer,
    paymentSymbol: offering.payment.symbol,
    paymentDecimals: offering.payment.decimals,
    tokenSymbol: offering.token.symbol,
    tokenDecimals: offering.token.decimals,
    payUnits: quote.payUnits.toString(),
    tokenUnits: quote.tokenUnits.toString(),
    state: "CREATED",
    createdAt: at,
    updatedAt: at,
    expiresAt: new Date(now.getTime() + INTENT_TTL_MS).toISOString(),
    payment: null,
    delivery: null,
    history: [{ state: "CREATED", at }],
    note: null,
    testnet: isTestnet,
  };
  move(intent, "AWAITING_PAYMENT");

  return locked(async () => {
    const all = await readAll();
    all.push(intent);
    await writeAll(all);
    return intent;
  });
}

// ---------- record transactions ----------

function assertHash(hash: string): asserts hash is Hash {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new CheckoutError("That isn’t a transaction hash.");
}

export async function recordPayment(id: string, hash: string): Promise<Intent> {
  assertHash(hash);
  return locked(async () => {
    const all = await readAll();
    const intent = all.find((i) => i.id === id);
    if (!intent) throw new CheckoutError("No checkout with that reference.", 404);
    const used = all.find((i) => i.payment?.hash.toLowerCase() === hash.toLowerCase() || i.delivery?.hash.toLowerCase() === hash.toLowerCase());
    if (used) {
      if (used.id === id) return intent; // the same submission twice is a no-op
      throw new CheckoutError("That transaction is already linked to another checkout.", 409);
    }
    if (intent.state !== "AWAITING_PAYMENT") {
      throw new CheckoutError("This checkout isn’t waiting for a payment.", 409);
    }
    intent.payment = { hash, block: null };
    move(intent, "PAYMENT_SUBMITTED", null);
    await writeAll(all);
    return intent;
  });
}

export async function recordDelivery(id: string, hash: string): Promise<Intent> {
  assertHash(hash);
  return locked(async () => {
    const all = await readAll();
    const intent = all.find((i) => i.id === id);
    if (!intent) throw new CheckoutError("No checkout with that reference.", 404);
    const used = all.find((i) => i.payment?.hash.toLowerCase() === hash.toLowerCase() || i.delivery?.hash.toLowerCase() === hash.toLowerCase());
    if (used && !(used.id === id && intent.delivery?.hash.toLowerCase() === hash.toLowerCase())) {
      throw new CheckoutError("That transaction is already linked to a checkout.", 409);
    }
    if (intent.state === "DELIVERY_FAILED") move(intent, "DELIVERY_PENDING", null);
    if (intent.state !== "DELIVERY_PENDING") {
      throw new CheckoutError("Delivery can only be recorded after payment is confirmed.", 409);
    }
    intent.delivery = { hash, block: null };
    intent.updatedAt = new Date().toISOString();
    await writeAll(all);
    return intent;
  });
}

// ---------- reconcile against the chain ----------

async function reconcileOne(intent: Intent, offering: Offering): Promise<boolean> {
  const before = intent.state;

  if (intent.state === "AWAITING_PAYMENT" && Date.now() > Date.parse(intent.expiresAt)) {
    move(intent, "EXPIRED", "The intent passed its deadline before a payment was sent.");
  }

  if (intent.state === "PAYMENT_SUBMITTED" && intent.payment && offering.payment.address && offering.treasury) {
    const r = await checkTransfer(
      intent.payment.hash as Hash,
      offering.payment.address,
      intent.buyer as Address,
      offering.treasury,
      BigInt(intent.payUnits),
    );
    if (r.status === "confirmed") {
      intent.payment.block = r.block.toString();
      move(intent, "PAYMENT_CONFIRMED", null);
      move(intent, "DELIVERY_PENDING", null);
    } else if (r.status === "reverted") {
      intent.payment.block = r.block.toString();
      move(intent, "PAYMENT_FAILED", "The payment transaction reverted on-chain.");
    } else if (r.status === "mismatch") {
      intent.payment.block = r.block.toString();
      move(intent, "PAYMENT_FAILED", "The transaction didn’t transfer the quoted amount to the issuer’s treasury.");
    }
  }

  if (intent.state === "DELIVERY_PENDING" && intent.delivery && offering.token.address && offering.inventory) {
    const r = await checkTransfer(
      intent.delivery.hash as Hash,
      offering.token.address,
      offering.inventory,
      intent.buyer as Address,
      BigInt(intent.tokenUnits),
    );
    if (r.status === "confirmed") {
      intent.delivery.block = r.block.toString();
      move(intent, "SETTLED", null);
    } else if (r.status === "reverted") {
      intent.delivery.block = r.block.toString();
      move(intent, "DELIVERY_FAILED", "The token suite rejected the transfer; the delivery transaction reverted.");
    } else if (r.status === "mismatch") {
      // Not this checkout's delivery: unlink it and keep waiting.
      intent.delivery = null;
      intent.note = "The recorded delivery transaction didn’t send the quoted tokens to this wallet, so it was unlinked.";
      intent.updatedAt = new Date().toISOString();
      return true;
    }
  }

  return intent.state !== before;
}

/** Re-reads chain state for one intent and saves any change. Chain state is authoritative. */
export async function refreshIntent(id: string): Promise<Intent | null> {
  return locked(async () => {
    const all = await readAll();
    const intent = all.find((i) => i.id === id);
    if (!intent) return null;
    const offering = getOffering(intent.offeringId);
    if (!offering) return intent;
    try {
      if (await reconcileOne(intent, offering)) await writeAll(all);
    } catch {
      // RPC trouble: keep the last verified state and say so; never guess forward.
      intent.note = `${networkLabel} couldn’t be reached just now. The last verified state is shown.`;
    }
    return intent;
  });
}
