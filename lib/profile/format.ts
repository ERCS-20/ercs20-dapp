import { formatUnits } from "viem";

/** SSR-safe UTC datetime (avoids locale hydration mismatch). */
export function formatProfileDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export function formatProfileBalance(raw: string, decimals = 18): string {
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

export function shortTokenAddress(address: string): string {
  if (!address || address.length < 10) return address || "—";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function shortTxHash(hash: string): string {
  if (!hash || hash.length < 12) return hash || "—";
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export function shortRefId(ref: string): string {
  if (!ref) return "—";
  if (ref.length <= 14) return ref;
  return `${ref.slice(0, 8)}…${ref.slice(-4)}`;
}

export function formatSignedBalanceDelta(raw: string, symbol: string): string {
  try {
    const v = BigInt(raw);
    if (v === BigInt(0)) return `0 ${symbol}`;
    const abs = v < BigInt(0) ? -v : v;
    const formatted = formatProfileBalance(abs.toString());
    return `${v < BigInt(0) ? "-" : "+"}${formatted} ${symbol}`;
  } catch {
    return `${raw} ${symbol}`;
  }
}
