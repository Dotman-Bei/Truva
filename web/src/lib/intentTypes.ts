import type { CheckoutState } from "./states";

export type IntentTx = { hash: string; block: string | null } | null;

export type Intent = {
  id: string;
  offeringId: string;
  offeringName: string;
  buyer: string;
  paymentSymbol: string;
  paymentDecimals: number;
  tokenSymbol: string;
  tokenDecimals: number;
  /** Integer units as decimal strings, so they survive JSON without loss. */
  payUnits: string;
  tokenUnits: string;
  state: CheckoutState;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  payment: IntentTx;
  delivery: IntentTx;
  /** When each state was entered. */
  history: { state: CheckoutState; at: string }[];
  /** Plain-language reason for a failure or a stuck step. Never contains secrets. */
  note: string | null;
  testnet: boolean;
  /** True only for labelled interface previews (TRUVA_UI_PREVIEW). */
  preview?: boolean;
};
