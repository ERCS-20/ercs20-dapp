export function formatSpotPrice(value: number, decimals = 4): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

export function formatSpotSize(value: number, decimals = 4): string {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

export function formatSpotPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** 24h price change in quote terms (e.g. USDC). */
export function formatSpotChangeAmount(lastPrice: number, change24hPct: number): string {
  if (!Number.isFinite(lastPrice) || !Number.isFinite(change24hPct)) return "—";
  const prev = lastPrice / (1 + change24hPct / 100);
  const delta = lastPrice - prev;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${formatSpotPrice(delta)}`;
}

export function formatSpotTotal(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function shortTxHash(hash: string): string {
  if (!hash || hash.length < 10) return hash || "—";
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}
