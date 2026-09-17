import { formatUnits } from "viem";

/** Format bigint balance for display in spot UI. */
export function formatBalanceDisplay(
  value: bigint | undefined,
  decimals: number,
  fallback = "0"
): string {
  if (value == null) return fallback;
  try {
    const s = formatUnits(value, decimals);
    const n = Number(s);
    if (!Number.isFinite(n)) return s;
    return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  } catch {
    return fallback;
  }
}
