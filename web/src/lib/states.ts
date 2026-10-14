export type CheckoutState =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_SUBMITTED"
  | "PAYMENT_CONFIRMED"
  | "DELIVERY_PENDING"
  | "SETTLED"
  | "EXPIRED"
  | "PAYMENT_FAILED"
  | "DELIVERY_FAILED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "CANCELLED";

export type Tone = "neutral" | "progress" | "done" | "fail" | "closed" | "demo";

export type StateInfo = {
  label: string;
  tone: Tone;
  meaning: string;
  next: string;
  /** What the buyer sees in this state; {placeholders} are filled on the checkout page. */
  detail: string;
};

export const STATES: Record<CheckoutState, StateInfo> = {
  CREATED: {
    label: "Intent created",
    tone: "neutral",
    meaning: "A payment intent exists for your wallet and amount",
    next: "You",
    detail: "The quote is held until the intent expires. Nothing has been paid. You can still change the amount.",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting payment",
    tone: "neutral",
    meaning: "Truva is waiting for your signed transfer",
    next: "You",
    detail: "Sign the transfer in your wallet. Truva will not retry a payment without a fresh click from you.",
  },
  PAYMENT_SUBMITTED: {
    label: "Payment submitted",
    tone: "progress",
    meaning: "Your transaction is waiting to be included in a block",
    next: "BOT Chain",
    detail: "Truva is watching your transaction. A refresh never sends a second payment.",
  },
  PAYMENT_CONFIRMED: {
    label: "Payment confirmed",
    tone: "progress",
    meaning: "The transfer is final on-chain",
    next: "The issuer",
    detail: "Truva checked the amount, the token and the recipient against the intent.",
  },
  DELIVERY_PENDING: {
    label: "Delivery pending",
    tone: "progress",
    meaning: "Payment confirmed, delivery pending",
    next: "The issuer",
    detail: "Your payment is confirmed. The issuer’s delivery has not reached your wallet yet. Keep your intent reference.",
  },
  SETTLED: {
    label: "Settled",
    tone: "done",
    meaning: "Payment and delivery both verified",
    next: "No one",
    detail: "Both transactions are verified on-chain. Your receipt links to each one.",
  },
  DELIVERY_FAILED: {
    label: "Delivery failed",
    tone: "fail",
    meaning: "The token suite rejected the transfer",
    next: "The issuer",
    detail: "ModularCompliance refused the delivery. Your checkout is not complete, and Truva shows the reason the contract gave.",
  },
  PAYMENT_FAILED: {
    label: "Payment failed",
    tone: "fail",
    meaning: "The payment transaction reverted",
    next: "You",
    detail: "No funds left your wallet beyond the network fee. Start a new intent when you are ready.",
  },
  EXPIRED: {
    label: "Expired",
    tone: "closed",
    meaning: "The intent passed its deadline unpaid",
    next: "You",
    detail: "Nothing was paid. Create a new intent to get a fresh quote.",
  },
  REFUND_PENDING: {
    label: "Refund pending",
    tone: "progress",
    meaning: "The issuer has started a refund",
    next: "The issuer",
    detail: "A refund is in progress. Truva marks it refunded only after the refund transaction confirms.",
  },
  REFUNDED: {
    label: "Refunded",
    tone: "neutral",
    meaning: "The refund is verified on-chain",
    next: "No one",
    detail: "The refund transaction is confirmed. This checkout is closed.",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "closed",
    meaning: "The intent was cancelled before payment",
    next: "No one",
    detail: "Nothing was paid. Create a new intent if you still want to buy.",
  },
};

/** The rows on the Home lifecycle board, in the order a buyer meets them. */
export const BOARD_ORDER: CheckoutState[] = [
  "CREATED",
  "AWAITING_PAYMENT",
  "PAYMENT_SUBMITTED",
  "PAYMENT_CONFIRMED",
  "DELIVERY_PENDING",
  "SETTLED",
  "DELIVERY_FAILED",
  "PAYMENT_FAILED",
  "EXPIRED",
];

export const HAPPY_PATH: CheckoutState[] = BOARD_ORDER.slice(0, 6);
