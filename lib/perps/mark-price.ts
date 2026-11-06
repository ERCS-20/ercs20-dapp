import { priceX18ToNumber } from "@/lib/perps/positions-format";
import { formatSubscriptPrice } from "@/lib/utils/price";
import type { MarketMark } from "@/services/perps/market/types";

export type MarkPriceText = {
  /** Display label, including subscript formatting. */
  label: string;
  /** Plain decimal for the close-price input. */
  input: string;
};

function formatMarkInput(value: number, priceDecimal: number): string {
  const digits = Math.min(Math.max(priceDecimal, 0), 18);
  const fixed = value.toFixed(digits);
  if (!fixed.includes(".")) return fixed;
  return fixed.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
}

/** Human price at the pair's engine scale. `null` when the scale or price is missing. */
export function formatEnginePrice(
  price: number,
  enginePriceDecimal: number | undefined
): MarkPriceText | null {
  if (enginePriceDecimal == null || !Number.isFinite(price) || price <= 0) return null;
  return {
    label: formatSubscriptPrice(price, enginePriceDecimal),
    input: formatMarkInput(price, enginePriceDecimal),
  };
}

/** Worst fill versus the mark for a one-click close. Long sells lower, short buys higher. */
export const FLASH_CLOSE_SLIPPAGE = 0.03;

/**
 * Limit price for a flash close. Long (buy position) sells at mark × 97%.
 * Short buys at mark × 103%. The book still fills at a better price when one exists.
 */
export function flashCloseLimitPrice(
  positionSide: "buy" | "sell",
  markInput: string,
  enginePriceDecimal: number | undefined
): MarkPriceText | null {
  const mark = Number(markInput);
  if (!Number.isFinite(mark) || mark <= 0) return null;
  const factor =
    positionSide === "buy" ? 1 - FLASH_CLOSE_SLIPPAGE : 1 + FLASH_CLOSE_SLIPPAGE;
  return formatEnginePrice(mark * factor, enginePriceDecimal);
}

/** `markX18 / 1e18`, formatted with the pair's engine price scale. */
export function formatMarkPrice(
  mark: Pick<MarketMark, "markX18">,
  enginePriceDecimal: number | undefined
): MarkPriceText | null {
  return formatEnginePrice(priceX18ToNumber(mark.markX18), enginePriceDecimal);
}
