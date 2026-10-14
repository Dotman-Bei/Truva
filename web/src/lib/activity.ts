import type { CheckoutState } from "./states";

export type ActivityRow = {
  intentId: string;
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

/**
 * Recent checkouts, read from the event index and reconciled against chain state.
 * The indexer arrives with the checkout flow (M3); until then there is genuinely
 * nothing to show, and the UI says so rather than inventing rows.
 */
export async function getRecentActivity(limit = 6): Promise<ActivityRow[]> {
  const rows: ActivityRow[] = [];
  return rows.slice(0, limit);
}
