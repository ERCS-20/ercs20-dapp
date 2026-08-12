/**
 * Parse API datetime: Unix epoch milliseconds (preferred) or legacy ISO-8601 string.
 */
function toDate(value: number | string): Date {
  if (typeof value === "number") {
    return new Date(value);
  }
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return new Date(Number(trimmed));
  }
  return new Date(trimmed);
}

/**
 * Display datetime in the browser's local timezone.
 * Backend sends Unix epoch milliseconds after Jackson WRITE_DATES_AS_TIMESTAMPS.
 */
export function formatUtcDateTime(value: number | string): string {
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** SSR-safe UTC time `HH:mm:ss` (avoids locale hydration mismatch). */
export function formatUtcTime(value: number | string | Date): string {
  const d = value instanceof Date ? value : toDate(value as number | string);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/**
 * Client display time `HH:mm:ss` in the page/browser timezone.
 * Prefer Client Components (local offset differs from UTC / SSR).
 */
export function formatLocalTime(value: number | string | Date): string {
  const d = value instanceof Date ? value : toDate(value as number | string);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Shift UTC unix seconds so lightweight-charts UTC tick labels show local wall time.
 * @see https://tradingview.github.io/lightweight-charts/docs/time-zones
 */
export function utcSecondsToLocalChartTime(utcSeconds: number): number {
  const d = new Date(utcSeconds * 1000);
  return (
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds()
    ) / 1000
  );
}
