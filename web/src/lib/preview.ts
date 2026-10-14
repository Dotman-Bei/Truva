import { primaryOffering as o } from "@/config/offerings";
import type { Intent } from "./intentTypes";
import type { CheckoutState } from "./states";

/**
 * Interface previews: one example checkout per state, for design review and demo recordings.
 * Enabled only with TRUVA_UI_PREVIEW=1, always flagged `preview`, never written to the store,
 * and rendered with a banner saying no transaction took place.
 */
const SLUGS: Record<string, CheckoutState> = {
  "awaiting-payment": "AWAITING_PAYMENT",
  "payment-submitted": "PAYMENT_SUBMITTED",
  "delivery-pending": "DELIVERY_PENDING",
  settled: "SETTLED",
  "payment-failed": "PAYMENT_FAILED",
  "delivery-failed": "DELIVERY_FAILED",
  expired: "EXPIRED",
};

export const PREVIEW_SLUGS = Object.keys(SLUGS);

const PATH: Partial<Record<CheckoutState, CheckoutState[]>> = {
  AWAITING_PAYMENT: ["CREATED", "AWAITING_PAYMENT"],
  PAYMENT_SUBMITTED: ["CREATED", "AWAITING_PAYMENT", "PAYMENT_SUBMITTED"],
  DELIVERY_PENDING: ["CREATED", "AWAITING_PAYMENT", "PAYMENT_SUBMITTED", "PAYMENT_CONFIRMED", "DELIVERY_PENDING"],
  SETTLED: ["CREATED", "AWAITING_PAYMENT", "PAYMENT_SUBMITTED", "PAYMENT_CONFIRMED", "DELIVERY_PENDING", "SETTLED"],
  PAYMENT_FAILED: ["CREATED", "AWAITING_PAYMENT", "PAYMENT_SUBMITTED", "PAYMENT_FAILED"],
  DELIVERY_FAILED: ["CREATED", "AWAITING_PAYMENT", "PAYMENT_SUBMITTED", "PAYMENT_CONFIRMED", "DELIVERY_PENDING", "DELIVERY_FAILED"],
  EXPIRED: ["CREATED", "AWAITING_PAYMENT", "EXPIRED"],
};

const NOTES: Partial<Record<CheckoutState, string>> = {
  PAYMENT_FAILED: "The payment transaction reverted on-chain.",
  DELIVERY_FAILED: "The token suite rejected the transfer; the delivery transaction reverted.",
  EXPIRED: "The intent passed its deadline before a payment was sent.",
};

export function previewEnabled(): boolean {
  return process.env.TRUVA_UI_PREVIEW === "1";
}

export function previewIntent(id: string): Intent | null {
  if (!previewEnabled() || !id.startsWith("preview-")) return null;
  const state = SLUGS[id.slice("preview-".length)];
  if (!state) return null;

  const path = PATH[state]!;
  const start = Date.parse("2026-10-14T09:12:00Z");
  const history = path.map((s, i) => ({ state: s, at: new Date(start + i * 47_000).toISOString() }));
  const paid = path.includes("PAYMENT_SUBMITTED");
  const delivered = state === "SETTLED" || state === "DELIVERY_FAILED";

  return {
    id: "TRV-7Q4K-2M9D",
    offeringId: o.id,
    offeringName: o.name,
    buyer: "0x3f2a8c41d07b5e9a26f1c3d84b0e7a5f2c6d91c4",
    paymentSymbol: o.payment.symbol,
    paymentDecimals: o.payment.decimals,
    tokenSymbol: o.token.symbol,
    tokenDecimals: o.token.decimals,
    payUnits: (250n * 10n ** BigInt(o.payment.decimals)).toString(),
    tokenUnits: (25n * 10n ** BigInt(o.token.decimals)).toString(),
    state,
    createdAt: history[0].at,
    updatedAt: history[history.length - 1].at,
    expiresAt: new Date(start + 30 * 60_000).toISOString(),
    payment: paid
      ? { hash: "0x9b1e5c07a3d84f2b61e09c7d3a5f8b2e4c6d1a0f9e8b7c6d5a4f3e2d1c0b40aa", block: state === "PAYMENT_SUBMITTED" ? null : "4810233" }
      : null,
    delivery: delivered
      ? { hash: "0x51c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2e7f3", block: "4810251" }
      : null,
    history,
    note: NOTES[state] ?? null,
    testnet: true,
    preview: true,
  };
}
