import "server-only";
import { formatUnits } from "viem";
import { listIntents } from "./intents";
import type { CheckoutState } from "./states";

export type ActivityRow = {
  intentId: string;
  offeringId: string;
  offeringName: string;
  buyer: string;
  amount: string;
  paymentSymbol: string;
  state: CheckoutState;
  paymentTx: string | null;
  deliveryTx: string | null;
  updatedAt: string;
  testnet: boolean;
};

/** Filter groups shared by Home and Activity. */
export const GROUPS = {
  pending: ["CREATED", "AWAITING_PAYMENT", "PAYMENT_SUBMITTED", "PAYMENT_CONFIRMED"],
  "delivery-pending": ["DELIVERY_PENDING", "REFUND_PENDING"],
  settled: ["SETTLED"],
  failed: ["PAYMENT_FAILED", "DELIVERY_FAILED"],
  expired: ["EXPIRED", "CANCELLED", "REFUNDED"],
} satisfies Record<string, CheckoutState[]>;

export type Group = keyof typeof GROUPS;

export function inGroup(state: CheckoutState, group: Group | null): boolean {
  return !group || (GROUPS[group] as CheckoutState[]).includes(state);
}

/**
 * Checkouts from the intent store, newest first. Every row was reconciled against chain state
 * when it last changed; nothing here is invented, so an empty list is shown as empty.
 */
export async function getActivity(filter?: { buyer?: string }): Promise<ActivityRow[]> {
  const intents = await listIntents(filter);
  return intents.map((i) => ({
    intentId: i.id,
    offeringId: i.offeringId,
    offeringName: i.offeringName,
    buyer: i.buyer,
    amount: formatUnits(BigInt(i.payUnits), i.paymentDecimals),
    paymentSymbol: i.paymentSymbol,
    state: i.state,
    paymentTx: i.payment?.hash ?? null,
    deliveryTx: i.delivery?.hash ?? null,
    updatedAt: i.updatedAt,
    testnet: i.testnet,
  }));
}
