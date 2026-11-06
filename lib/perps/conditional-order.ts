import { parseEnginePrice } from "@/lib/market/order-place-amounts";
import { enginePriceToPriceX18 } from "@/lib/perps/build-place-order";

/** `ConditionalOrders.TYPE_TRIGGER_LIMIT`. */
export const CONDITIONAL_ORDER_TRIGGER_LIMIT = "TriggerLimit";
/** `ConditionalOrders.TYPE_TP_SL`. */
export const CONDITIONAL_ORDER_TP_SL = "TpSl";
/** `ConditionalOrders.PRICE_LAST`. */
export const TRIGGER_PRICE_LAST = "Last";
/** `ConditionalOrders.DIRECTION_UP` — 涨到. */
export const TRIGGER_DIRECTION_UP = 1;
/** `ConditionalOrders.DIRECTION_DOWN` — 跌到. */
export const TRIGGER_DIRECTION_DOWN = 2;

/** Engine-scaled limit or trigger price as `priceX18`. */
export function priceInputToX18(
  price: string,
  enginePriceDecimal: number
): bigint | null {
  const engine = parseEnginePrice(price, enginePriceDecimal);
  if (engine == null) return null;
  return enginePriceToPriceX18(engine, enginePriceDecimal);
}

/**
 * Trigger direction versus the current price. Equal prices have no backend direction.
 * 1 = rise to the trigger, 2 = fall to the trigger.
 */
export function triggerDirectionAgainstPrice(
  triggerPrice: string,
  currentPrice: string,
  enginePriceDecimal: number
): 1 | 2 | null {
  const trigger = priceInputToX18(triggerPrice, enginePriceDecimal);
  const current = priceInputToX18(currentPrice, enginePriceDecimal);
  if (trigger == null || current == null || trigger === current) return null;
  return trigger > current ? TRIGGER_DIRECTION_UP : TRIGGER_DIRECTION_DOWN;
}
