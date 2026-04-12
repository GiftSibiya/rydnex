export function parseExpiryToLocalDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function formatExpiryDisplay(iso: string): string {
  if (!iso.trim()) return "—";
  return parseExpiryToLocalDate(iso).toLocaleDateString("en-ZA");
}

/** Local calendar date as YYYY-MM-DD (for forms and API date fields). */
export function dateToYmd(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const da = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}
