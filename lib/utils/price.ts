/** Unicode subscript digits for compact small-price display (e.g. 0.0₅2339). */
const SUBSCRIPT_DIGITS = "₀₁₂₃₄₅₆₇₈₉";

function toSubscript(n: number): string {
  return String(n)
    .split("")
    .map((d) => SUBSCRIPT_DIGITS[Number(d)] ?? d)
    .join("");
}

/**
 * Crypto-style tiny price: `0.0₅2339` = 0.000002339
 * Subscript = count of leading zeros after the decimal point.
 */
function tryFormatSubscriptLeadingZeros(
  abs: number,
  priceDecimal: number
): string | null {
  if (abs <= 0 || abs >= 0.01) return null;

  const fixed = abs.toFixed(Math.min(Math.max(priceDecimal, 8), 18));
  const trimmed = fixed.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, ".0");
  const match = trimmed.match(/^0\.(0+)([1-9]\d*)$/);
  if (!match) return null;

  const zeroCount = match[1].length;
  if (zeroCount < 4) return null;

  const sig = match[2].replace(/0+$/, "").slice(0, 4) || match[2].slice(0, 4);
  return `0.0${toSubscript(zeroCount)}${sig}`;
}

/**
 * Quote price for UI — subscript leading zeros when tiny (e.g. `0.0₅2339`).
 * @param priceDecimal Integer price scale (÷ 10^priceDecimal), e.g. matching-engine `enginePriceDecimal`.
 */
export function formatSubscriptPrice(value: number, priceDecimal = 4): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0.00";

  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  const compact = tryFormatSubscriptLeadingZeros(abs, priceDecimal);
  if (compact) return `${sign}${compact}`;

  const maxFrac = Math.max(2, Math.min(priceDecimal, 10));
  return (
    sign +
    abs.toLocaleString(undefined, {
      minimumFractionDigits: Math.min(2, maxFrac),
      maximumFractionDigits: maxFrac,
    })
  );
}

/** Price change in quote terms from last price and percent change. */
export function formatPriceChangeAmount(
  lastPrice: number,
  changePct: number,
  priceDecimal = 4
): string {
  if (!Number.isFinite(lastPrice) || !Number.isFinite(changePct)) return "—";
  const prev = lastPrice / (1 + changePct / 100);
  const delta = lastPrice - prev;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${formatSubscriptPrice(delta, priceDecimal)}`;
}

/** Order book / trade quantity. */
export function formatQuantity(value: number, decimals = 4): string {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

/** Signed percent change, e.g. `+1.23%`. */
export function formatPercentChange(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Fixed 2-decimal quote amount (order total, fee). */
export function formatQuoteAmount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
