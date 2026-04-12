/** Format a number for display/storage as a plain decimal (no currency symbol). */
export function formatDecimal(value: number | null | undefined, fractionDigits = 2): string {
  if (value == null || Number.isNaN(Number(value))) return "";
  return Number(value).toFixed(fractionDigits);
}

export function parseDecimalInput(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (!t) return null;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}
