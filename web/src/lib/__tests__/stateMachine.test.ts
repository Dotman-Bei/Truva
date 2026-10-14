import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, IllegalTransitionError, isTerminal } from "../stateMachine";
import { HAPPY_PATH, STATES, type CheckoutState } from "../states";

const ALL = Object.keys(STATES) as CheckoutState[];

describe("checkout state machine", () => {
  it("walks the happy path one legal step at a time", () => {
    for (let i = 0; i < HAPPY_PATH.length - 1; i++) {
      expect(canTransition(HAPPY_PATH[i], HAPPY_PATH[i + 1])).toBe(true);
    }
  });

  it("reaches SETTLED only from DELIVERY_PENDING", () => {
    const into = ALL.filter((s) => canTransition(s, "SETTLED"));
    expect(into).toEqual(["DELIVERY_PENDING"]);
  });

  it("never skips payment confirmation", () => {
    expect(canTransition("AWAITING_PAYMENT", "DELIVERY_PENDING")).toBe(false);
    expect(canTransition("PAYMENT_SUBMITTED", "DELIVERY_PENDING")).toBe(false);
    expect(canTransition("PAYMENT_SUBMITTED", "SETTLED")).toBe(false);
  });

  it("cannot turn a failure into a success", () => {
    expect(canTransition("PAYMENT_FAILED", "PAYMENT_CONFIRMED")).toBe(false);
    expect(canTransition("DELIVERY_FAILED", "SETTLED")).toBe(false);
    expect(canTransition("EXPIRED", "AWAITING_PAYMENT")).toBe(false);
  });

  it("marks only REFUNDED after a verified refund", () => {
    expect(ALL.filter((s) => canTransition(s, "REFUNDED"))).toEqual(["REFUND_PENDING"]);
  });

  it("allows a rejected delivery to be retried or refunded, nothing else", () => {
    expect(ALL.filter((s) => canTransition("DELIVERY_FAILED", s)).sort()).toEqual(["DELIVERY_PENDING", "REFUND_PENDING"]);
  });

  it("treats settled, failed payment, expired, refunded and cancelled as terminal", () => {
    for (const s of ["SETTLED", "PAYMENT_FAILED", "EXPIRED", "REFUNDED", "CANCELLED"] as CheckoutState[]) {
      expect(isTerminal(s)).toBe(true);
    }
    expect(isTerminal("DELIVERY_FAILED")).toBe(false);
  });

  it("throws on an illegal jump", () => {
    expect(() => assertTransition("CREATED", "SETTLED")).toThrow(IllegalTransitionError);
    expect(() => assertTransition("SETTLED", "DELIVERY_PENDING")).toThrow(IllegalTransitionError);
  });
});
