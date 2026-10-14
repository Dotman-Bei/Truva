import { formatUnits, parseUnits } from "viem";
import type { Offering } from "@/config/offerings";

export type Quote =
  | { ok: true; payUnits: bigint; tokenUnits: bigint; pay: string; receive: string }
  | { ok: false; reason: string };

/** Turns a payment amount typed by the buyer into exact integer units. Never floats. */
export function quoteFor(offering: Offering, amount: string): Quote {
  const { payment, token } = offering;
  const clean = amount.trim();
  if (!clean) return { ok: false, reason: "Enter an amount." };
  if (!/^\d+(\.\d+)?$/.test(clean)) return { ok: false, reason: "Use numbers only, like 250 or 250.50." };
  const decimals = clean.split(".")[1]?.length ?? 0;
  if (decimals > payment.decimals) {
    return { ok: false, reason: `${payment.symbol} has at most ${payment.decimals} decimal places.` };
  }

  const payUnits = parseUnits(clean, payment.decimals);
  const min = parseUnits(offering.minPurchase, payment.decimals);
  const max = parseUnits(offering.maxPurchase, payment.decimals);
  if (payUnits < min) return { ok: false, reason: `Minimum is ${offering.minPurchase} ${payment.symbol}.` };
  if (payUnits > max) return { ok: false, reason: `Maximum is ${offering.maxPurchase} ${payment.symbol}.` };

  const price = parseUnits(offering.pricePerToken, payment.decimals);
  const tokenUnits = (payUnits * 10n ** BigInt(token.decimals)) / price;
  if (tokenUnits === 0n) return { ok: false, reason: "That amount buys less than the smallest token unit." };

  return {
    ok: true,
    payUnits,
    tokenUnits,
    pay: formatUnits(payUnits, payment.decimals),
    receive: formatUnits(tokenUnits, token.decimals),
  };
}
