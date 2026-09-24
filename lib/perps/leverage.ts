/** Isolated leverage for perps place-order (margin = notional / leverage). */

export const PERPS_LEVERAGE_MIN = 1;
export const PERPS_LEVERAGE_MAX = 100;
export const PERPS_LEVERAGE_DEFAULT = 5;

const STORAGE_KEY = "orbix.perps.leverage";

/**
 * Slider stops: 10 segments from 1x → 100x
 * (1, 10, 20, …, 100).
 */
export const PERPS_LEVERAGE_STOPS = [
  1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
] as const;

export function clampPerpsLeverage(value: number): number {
  if (!Number.isFinite(value)) return PERPS_LEVERAGE_DEFAULT;
  return Math.min(
    PERPS_LEVERAGE_MAX,
    Math.max(PERPS_LEVERAGE_MIN, Math.trunc(value))
  );
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Read last selected leverage (clamped); falls back to default. */
export function readCachedPerpsLeverage(): number {
  if (!canUseStorage()) return PERPS_LEVERAGE_DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "") return PERPS_LEVERAGE_DEFAULT;
    const n = Number(raw);
    if (!Number.isFinite(n)) return PERPS_LEVERAGE_DEFAULT;
    return clampPerpsLeverage(n);
  } catch {
    return PERPS_LEVERAGE_DEFAULT;
  }
}

export function writeCachedPerpsLeverage(leverage: number): void {
  if (!canUseStorage()) return;
  const lev = clampPerpsLeverage(leverage);
  try {
    window.localStorage.setItem(STORAGE_KEY, String(lev));
  } catch {
    /* ignore */
  }
}

/** Nearest stop index for the leverage range slider. */
export function leverageToStopIndex(leverage: number): number {
  const lev = clampPerpsLeverage(leverage);
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < PERPS_LEVERAGE_STOPS.length; i++) {
    const d = Math.abs(PERPS_LEVERAGE_STOPS[i] - lev);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export function stopIndexToLeverage(index: number): number {
  const i = Math.min(
    PERPS_LEVERAGE_STOPS.length - 1,
    Math.max(0, Math.trunc(index))
  );
  return PERPS_LEVERAGE_STOPS[i];
}

/**
 * Isolated margin from quote notional: `floor(notional / leverage)`.
 * Returns null when result would be zero (order too small for this leverage).
 */
export function marginFromNotional(
  quoteNotional: bigint,
  leverage: number
): bigint | null {
  const lev = clampPerpsLeverage(leverage);
  if (quoteNotional <= BigInt(0)) return null;
  const margin = quoteNotional / BigInt(lev);
  return margin > BigInt(0) ? margin : null;
}

/**
 * Approximate isolated liquidation price (no maintenance margin).
 * Long: `entry × (1 − 1/lev)`; short: `entry × (1 + 1/lev)`.
 */
export function estimateLiqPrice(params: {
  entryPrice: number;
  leverage: number;
  side: "buy" | "sell";
}): number | null {
  const { entryPrice, side } = params;
  const lev = clampPerpsLeverage(params.leverage);
  if (!(entryPrice > 0) || lev < 1) return null;
  if (side === "buy") {
    const liq = entryPrice * (1 - 1 / lev);
    return liq > 0 ? liq : 0;
  }
  return entryPrice * (1 + 1 / lev);
}
