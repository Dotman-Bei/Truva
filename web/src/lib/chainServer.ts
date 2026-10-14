import "server-only";
import { createPublicClient, decodeEventLog, http, type Address, type Hash } from "viem";
import { botChain, chainConfigured } from "@/config/chain";
import { erc20Abi, identityRegistryAbi } from "./abi";

export const publicClient = chainConfigured
  ? createPublicClient({ chain: botChain, transport: http(undefined, { timeout: 8000 }) })
  : null;

/** true / false from the IdentityRegistry, or null when the answer can't be read (fail closed). */
export async function isEligible(registry: Address | null, wallet: Address): Promise<boolean | null> {
  if (!publicClient || !registry) return null;
  try {
    return await publicClient.readContract({
      address: registry,
      abi: identityRegistryAbi,
      functionName: "isVerified",
      args: [wallet],
    });
  } catch {
    return null;
  }
}

export type TransferCheck =
  | { status: "pending" }
  | { status: "reverted"; block: bigint }
  | { status: "mismatch"; block: bigint }
  | { status: "confirmed"; block: bigint };

/**
 * Looks for an ERC-20 / ERC-3643 Transfer(from, to, value) emitted by `token` in a mined transaction.
 * Only a successful receipt with the exact log counts as confirmed.
 */
export async function checkTransfer(
  hash: Hash,
  token: Address,
  from: Address,
  to: Address,
  value: bigint,
): Promise<TransferCheck> {
  if (!publicClient) throw new Error("Network not configured");
  let receipt;
  try {
    receipt = await publicClient.getTransactionReceipt({ hash });
  } catch (e) {
    if (e instanceof Error && e.name === "TransactionReceiptNotFoundError") return { status: "pending" };
    throw e;
  }
  if (receipt.status !== "success") return { status: "reverted", block: receipt.blockNumber };

  const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const match = receipt.logs.some((log) => {
    if (!eq(log.address, token)) return false;
    try {
      const ev = decodeEventLog({ abi: erc20Abi, data: log.data, topics: log.topics });
      return ev.eventName === "Transfer" && eq(ev.args.from, from) && eq(ev.args.to, to) && ev.args.value === value;
    } catch {
      return false;
    }
  });
  return match ? { status: "confirmed", block: receipt.blockNumber } : { status: "mismatch", block: receipt.blockNumber };
}
