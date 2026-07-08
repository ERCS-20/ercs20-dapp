import { formatUnits } from "viem";

import { apiBigIntToString, type ApiBigInt } from "@/lib/utils/coerce-bigint";

/** Format wei/base-unit balance for display. */
export function formatBalance(raw: ApiBigInt, decimals = 18): string {
  const rawStr = apiBigIntToString(raw);
  try {
    const v = BigInt(rawStr);
    const formatted = formatUnits(v, decimals);
    const n = Number(formatted);
    if (!Number.isFinite(n)) return formatted;
    return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  } catch {
    return rawStr;
  }
}

export function formatSignedBalanceDelta(raw: ApiBigInt, symbol: string, decimals = 18): string {
  const rawStr = apiBigIntToString(raw);
  try {
    const v = BigInt(rawStr);
    if (v === BigInt(0)) return `0 ${symbol}`;
    const abs = v < BigInt(0) ? -v : v;
    const formatted = formatBalance(abs.toString(), decimals);
    return `${v < BigInt(0) ? "-" : "+"}${formatted} ${symbol}`;
  } catch {
    return `${rawStr} ${symbol}`;
  }
}
