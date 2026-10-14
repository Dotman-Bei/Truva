import { describe, expect, it } from "vitest";
import { primaryOffering } from "@/config/offerings";
import { quoteFor } from "../quote";

const o = primaryOffering; // 10.00 per token, 6-decimal payment asset, 18-decimal token, 50–5,000 limits

describe("quoteFor", () => {
  it("converts a payment amount to exact integer units", () => {
    const q = quoteFor(o, "250");
    expect(q.ok).toBe(true);
    if (!q.ok) return;
    expect(q.payUnits).toBe(250_000_000n);
    expect(q.tokenUnits).toBe(25n * 10n ** 18n);
    expect(q.receive).toBe("25");
  });

  it("keeps fractional amounts exact, with no float rounding", () => {
    const q = quoteFor(o, "50.10");
    expect(q.ok && q.tokenUnits).toBe(5_010_000_000_000_000_000n);
  });

  it("rejects amounts under the minimum and over the maximum", () => {
    expect(quoteFor(o, "49.99")).toMatchObject({ ok: false, reason: expect.stringContaining("Minimum") });
    expect(quoteFor(o, "5000.01")).toMatchObject({ ok: false, reason: expect.stringContaining("Maximum") });
    expect(quoteFor(o, "5000").ok).toBe(true);
  });

  it("rejects more decimals than the payment asset has", () => {
    expect(quoteFor(o, "100.1234567")).toMatchObject({ ok: false, reason: expect.stringContaining("decimal") });
  });

  it("rejects anything that isn't a plain number", () => {
    for (const bad of ["", " ", "-100", "1e3", "100,00", "abc", "0x10"]) {
      expect(quoteFor(o, bad).ok).toBe(false);
    }
  });
});
