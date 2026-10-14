export function shortHex(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function formatAmount(value: string | number, fractionDigits = 2): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-GB", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
}
