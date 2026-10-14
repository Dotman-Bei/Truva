import type { CheckoutState } from "./states";

/** Every legal move in the checkout lifecycle (PRD §9.3). Anything else is rejected. */
const NEXT: Record<CheckoutState, CheckoutState[]> = {
  CREATED: ["AWAITING_PAYMENT", "EXPIRED", "CANCELLED"],
  AWAITING_PAYMENT: ["PAYMENT_SUBMITTED", "EXPIRED", "CANCELLED"],
  PAYMENT_SUBMITTED: ["PAYMENT_CONFIRMED", "PAYMENT_FAILED"],
  PAYMENT_CONFIRMED: ["DELIVERY_PENDING"],
  DELIVERY_PENDING: ["SETTLED", "DELIVERY_FAILED", "REFUND_PENDING"],
  DELIVERY_FAILED: ["DELIVERY_PENDING", "REFUND_PENDING"],
  REFUND_PENDING: ["REFUNDED"],
  SETTLED: [],
  EXPIRED: [],
  PAYMENT_FAILED: [],
  REFUNDED: [],
  CANCELLED: [],
};

export function canTransition(from: CheckoutState, to: CheckoutState): boolean {
  return NEXT[from].includes(to);
}

export class IllegalTransitionError extends Error {
  constructor(
    public from: CheckoutState,
    public to: CheckoutState,
  ) {
    super(`Illegal checkout transition ${from} → ${to}`);
    this.name = "IllegalTransitionError";
  }
}

export function assertTransition(from: CheckoutState, to: CheckoutState): void {
  if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
}

export function isTerminal(state: CheckoutState): boolean {
  return NEXT[state].length === 0;
}
