import { enginePriceToNumber } from "@/lib/market/engine-price-decimal";
import {
  formatOrderFee,
  formatOrderId,
  formatOrderQuantity,
  matchedSideToLabel,
  ORDER_SIDE_BUY,
  ORDER_SIDE_SELL,
  orderFillPercent,
  orderSideToLabel,
  type OpenOrderRow,
  type OrderHistoryRow,
  type TradeHistoryRow,
  formatOpenOrderStatus as formatOpen,
  formatOrderHistoryStatus as formatHistory,
  formatTradeStatus as formatTrade,
} from "@/lib/market/open-orders-format";
import { pairLabelFromCode } from "@/lib/market/pair";
import { apiBigIntToString, parseApiBigInt } from "@/lib/utils/coerce-bigint";
import type {
  OrdersHistoryRsp,
  OrdersRsp,
  OrdersTradeHistoryRsp,
} from "@/services/perps/orders/types";

export {
  formatOrderFee,
  formatOrderId,
  formatOrderQuantity,
  ORDER_SIDE_BUY,
  ORDER_SIDE_SELL,
  orderSideToLabel,
  type OpenOrderRow,
  type OrderHistoryRow,
  type TradeHistoryRow,
};

export function formatOpenOrderStatus(
  status: string,
  t: (key: string) => string
): string {
  return formatOpen("perps", status, t);
}

export function formatOrderHistoryStatus(
  status: string,
  t: (key: string) => string
): string {
  return formatHistory("perps", status, t);
}

export function formatTradeStatus(
  status: string,
  t: (key: string) => string
): string {
  return formatTrade("perps", status, t);
}

export function ordersRspToOpenOrderRow(order: OrdersRsp): OpenOrderRow {
  const price = enginePriceToNumber(order.enginePrice, order.enginePriceDecimal);
  const quantity = formatOrderQuantity(order.amount);
  const total = price * quantity;
  const margin = formatOrderFee(order.margin);
  return {
    orderId: apiBigIntToString(order.id),
    pairCode: order.pairCode,
    pairId: order.pairId,
    placedAt: order.placedAt,
    pairLabel: pairLabelFromCode(order.pairCode),
    side: orderSideToLabel(order.side),
    price,
    quantity,
    total,
    margin,
    leverage: leverageFromAmountAndMargin(order.amount, order.margin, order.priceX18),
    fillPercent: orderFillPercent(order.filledAmount, order.amount),
    status: order.status,
    enginePriceDecimal: order.enginePriceDecimal,
  };
}

export function ordersHistoryRspToRow(order: OrdersHistoryRsp): OrderHistoryRow {
  const price = enginePriceToNumber(order.enginePrice, order.enginePriceDecimal);
  const quantity = formatOrderQuantity(order.amount);
  const filledQuantity = formatOrderQuantity(order.filledAmount);
  const avg =
    filledQuantity > 0
      ? enginePriceToNumber(order.enginePrice, order.enginePriceDecimal)
      : null;
  return {
    orderId: apiBigIntToString(order.id),
    pairLabel: pairLabelFromCode(order.pairCode),
    side: orderSideToLabel(order.side),
    price,
    averagePrice: avg,
    quantity,
    filledQuantity,
    total: price * quantity,
    lockedMargin: formatOrderFee(order.lockedMargin),
    filledValue: avg != null ? avg * filledQuantity : null,
    leverage: leverageFromAmountAndMargin(order.amount, order.margin, order.priceX18),
    status: order.status,
    fee: formatOrderFee(order.fee),
    placedAt: order.placedAt,
    completedAt: order.completedAt,
    enginePriceDecimal: order.enginePriceDecimal,
  };
}

/**
 * Isolated leverage ≈ quoteNotional / margin.
 * `quoteNotional = amount × priceX18 / 1e18` (same units as margin).
 */
export function leverageFromAmountAndMargin(
  amount: Parameters<typeof parseApiBigInt>[0],
  margin: Parameters<typeof parseApiBigInt>[0],
  priceX18: Parameters<typeof parseApiBigInt>[0]
): number | null {
  const amountBi = parseApiBigInt(amount) ?? BigInt(0);
  const marginBi = parseApiBigInt(margin) ?? BigInt(0);
  const priceBi = parseApiBigInt(priceX18) ?? BigInt(0);
  if (amountBi <= BigInt(0) || marginBi <= BigInt(0) || priceBi <= BigInt(0)) {
    return null;
  }
  const quoteNotional = (amountBi * priceBi) / (BigInt(10) ** BigInt(18));
  if (quoteNotional <= BigInt(0)) return null;
  const lev = Number(quoteNotional / marginBi);
  return Number.isFinite(lev) && lev > 0 ? lev : null;
}

/** Pair cell suffix, e.g. ` (10x)`. */
export function formatLeveragePairSuffix(leverage: number | null | undefined): string {
  if (leverage == null || !(leverage > 0)) return "";
  return ` (${Math.round(leverage)}x)`;
}

/**
 * Perps trade history — fields differ from spot (`amount` base, no `quantity`).
 * Filled = average × amount, same as order-history Average × filledAmount.
 * Leverage ≈ quoteNotional / margin = (amount × enginePrice / 10^d) / margin.
 */
export function ordersTradeHistoryRspToRow(
  trade: OrdersTradeHistoryRsp
): TradeHistoryRow {
  const price = enginePriceToNumber(trade.enginePrice, trade.enginePriceDecimal);
  const quantity = formatOrderQuantity(trade.amount);
  const filledValue = price * quantity;
  return {
    orderId: formatOrderId(trade.orderId),
    pairLabel: pairLabelFromCode(trade.pairCode),
    placeSide: orderSideToLabel(trade.placeSide),
    matchedSide: matchedSideToLabel(trade.matchedSide),
    price,
    quantity,
    filledValue,
    leverage: leverageFromTradeAmountAndMargin(
      trade.amount,
      trade.margin,
      trade.enginePrice,
      trade.enginePriceDecimal
    ),
    fee: formatOrderFee(trade.fee),
    tradeTime: trade.tradeTime,
    tradeStatus: trade.tradeStatus,
    txHash: trade.txHash,
    enginePriceDecimal: trade.enginePriceDecimal,
  };
}

/**
 * Trade-fill leverage: `quoteNotional / margin` where
 * `quoteNotional = amount × enginePrice / 10^enginePriceDecimal`
 * (amount + margin share 18-decimal quote/base raw units).
 */
export function leverageFromTradeAmountAndMargin(
  amount: Parameters<typeof parseApiBigInt>[0],
  margin: Parameters<typeof parseApiBigInt>[0],
  enginePrice: Parameters<typeof parseApiBigInt>[0],
  enginePriceDecimal: number
): number | null {
  const amountBi = parseApiBigInt(amount) ?? BigInt(0);
  const marginBi = parseApiBigInt(margin) ?? BigInt(0);
  const priceBi = parseApiBigInt(enginePrice) ?? BigInt(0);
  if (
    amountBi <= BigInt(0) ||
    marginBi <= BigInt(0) ||
    priceBi <= BigInt(0) ||
    enginePriceDecimal < 0
  ) {
    return null;
  }
  const scale = BigInt(10) ** BigInt(enginePriceDecimal);
  const quoteNotional = (amountBi * priceBi) / scale;
  if (quoteNotional <= BigInt(0)) return null;
  const lev = Number(quoteNotional / marginBi);
  return Number.isFinite(lev) && lev > 0 ? lev : null;
}

/** Remaining free margin on an open order (display helper). */
export function remainingMargin(order: OrdersRsp): bigint {
  const margin = parseApiBigInt(order.margin) ?? BigInt(0);
  const locked = parseApiBigInt(order.lockedMargin) ?? BigInt(0);
  const rem = margin - locked;
  return rem > BigInt(0) ? rem : BigInt(0);
}
