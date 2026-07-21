import { formatUnits } from "viem";

import { apiBigIntToString, type ApiBigInt } from "@/lib/utils/coerce-bigint";

/**
 * Group integer digits of a decimal string for display (e.g. `1000000.5` → `1,000,000.5`).
 * Keeps the fractional part as-is to avoid float precision loss.
 */
export function formatGroupedDecimal(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "0";

  const negative = trimmed.startsWith("-");
  const raw = negative ? trimmed.slice(1) : trimmed;
  const dot = raw.indexOf(".");
  const intRaw = dot >= 0 ? raw.slice(0, dot) : raw;
  const fracRaw = dot >= 0 ? raw.slice(dot + 1) : null;

  const intDigits = intRaw.replace(/\D/g, "") || "0";
  const grouped = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const withFrac = fracRaw != null ? `${grouped}.${fracRaw}` : grouped;
  return negative ? `-${withFrac}` : withFrac;
}

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
