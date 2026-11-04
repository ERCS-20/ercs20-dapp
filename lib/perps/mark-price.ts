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

/** `markX18 / 1e18`, formatted with the pair's engine price scale. */
export function formatMarkPrice(
  mark: Pick<MarketMark, "markX18">,
  enginePriceDecimal: number | undefined
): MarkPriceText | null {
  if (enginePriceDecimal == null) return null;
  const price = priceX18ToNumber(mark.markX18);
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    label: formatSubscriptPrice(price, enginePriceDecimal),
    input: formatMarkInput(price, enginePriceDecimal),
  };
}
