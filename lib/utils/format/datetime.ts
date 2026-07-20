/** SSR-safe UTC datetime (avoids locale hydration mismatch). */
export function formatUtcDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/** SSR-safe UTC time `HH:mm:ss` (avoids locale hydration mismatch). */
export function formatUtcTime(value: number | string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/**
 * Client display time `HH:mm:ss` in the page/browser timezone.
 * Prefer Client Components (local offset differs from UTC / SSR).
 */
export function formatLocalTime(value: number | string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
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
