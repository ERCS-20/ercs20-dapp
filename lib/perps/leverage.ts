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

const ONE_X18 = BigInt(10) ** BigInt(18);

/**
 * Mirrors `PositionsService.calcLiqPrice`.
 * Ledger margin is typically negative for longs and positive for shorts.
 * Result is price × 1e18.
 */
export function calcLiqPriceX18(
  ledgerMargin: bigint,
  signedPosition: bigint,
  minCollateralX18: bigint
): bigint {
  if (signedPosition === BigInt(0) || minCollateralX18 <= BigInt(0)) {
    return BigInt(0);
  }
  if (signedPosition > BigInt(0) && ledgerMargin < BigInt(0)) {
    return (-ledgerMargin * minCollateralX18) / signedPosition;
  }
  if (signedPosition < BigInt(0) && ledgerMargin > BigInt(0)) {
    return (
      (ledgerMargin * ONE_X18 * ONE_X18) / (-signedPosition * minCollateralX18)
    );
  }
  return BigInt(0);
}

/**
 * Preview liq price for a new isolated order (fee ignored).
 * `ledgerMargin = isolatedMargin ∓ quoteNotional` (long subtracts, short adds).
 */
export function previewIsolatedLiqPrice(params: {
  side: "buy" | "sell";
  /** Unsigned base size (18 decimals). */
  amount: bigint;
  /** Isolated margin locked on the order (quote, 18 decimals). */
  isolatedMargin: bigint;
  priceX18: bigint;
  minCollateralX18: bigint;
}): number | null {
  const { amount, isolatedMargin, priceX18, minCollateralX18 } = params;
  if (
    amount <= BigInt(0) ||
    isolatedMargin <= BigInt(0) ||
    priceX18 <= BigInt(0) ||
    minCollateralX18 <= BigInt(0)
  ) {
    return null;
  }
  const quoteAmt = (amount * priceX18) / ONE_X18;
  const signedPosition = params.side === "buy" ? amount : -amount;
  const ledgerMargin =
    isolatedMargin + (params.side === "buy" ? -quoteAmt : quoteAmt);
  const liqX18 = calcLiqPriceX18(ledgerMargin, signedPosition, minCollateralX18);
  if (liqX18 <= BigInt(0)) return null;
  return Number(liqX18) / 1e18;
}
