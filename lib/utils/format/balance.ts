import { formatUnits } from "viem";

/** Format wei/base-unit balance string for display. */
export function formatBalance(raw: string, decimals = 18): string {
  try {
    const v = BigInt(raw);
    const formatted = formatUnits(v, decimals);
    const n = Number(formatted);
    if (!Number.isFinite(n)) return formatted;
    return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  } catch {
    return raw;
  }
}

export function formatSignedBalanceDelta(raw: string, symbol: string, decimals = 18): string {
  try {
    const v = BigInt(raw);
    if (v === BigInt(0)) return `0 ${symbol}`;
    const abs = v < BigInt(0) ? -v : v;
    const formatted = formatBalance(abs.toString(), decimals);
    return `${v < BigInt(0) ? "-" : "+"}${formatted} ${symbol}`;
  } catch {
    return `${raw} ${symbol}`;
  }
}
