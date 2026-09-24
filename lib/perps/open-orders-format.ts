import { enginePriceToNumber } from "@/lib/market/engine-price-decimal";
import {
  formatOrderFee,
  formatOrderId,
  formatOrderQuantity,
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
  return {
    orderId: apiBigIntToString(order.id),
    pairCode: order.pairCode,
    pairId: order.pairId,
    placedAt: order.placedAt,
    pairLabel: pairLabelFromCode(order.pairCode),
    side: orderSideToLabel(order.side),
    price,
    quantity,
    total: price * quantity,
    margin: formatOrderFee(order.margin),
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
    total: avg != null ? avg * filledQuantity : null,
    status: order.status,
    fee: formatOrderFee(order.fee),
    placedAt: order.placedAt,
    completedAt: order.completedAt,
    enginePriceDecimal: order.enginePriceDecimal,
  };
}

/** Trade-history DTO still mirrors spot until perps trade-history API lands. */
export function ordersTradeHistoryRspToRow(
  trade: OrdersTradeHistoryRsp
): TradeHistoryRow {
  return {
    orderId: formatOrderId(trade.orderId),
    pairLabel: pairLabelFromCode(trade.pairCode),
    placeSide: orderSideToLabel(trade.placeSide),
    price: enginePriceToNumber(trade.enginePrice, trade.enginePriceDecimal),
    quantity: formatOrderQuantity(trade.quantity),
    tradeTime: trade.tradeTime,
    tradeStatus: trade.tradeStatus,
    txHash: trade.txHash,
    enginePriceDecimal: trade.enginePriceDecimal,
  };
}

/** Remaining free margin on an open order (display helper). */
export function remainingMargin(order: OrdersRsp): bigint {
  const margin = parseApiBigInt(order.margin) ?? BigInt(0);
  const locked = parseApiBigInt(order.lockedMargin) ?? BigInt(0);
  const rem = margin - locked;
  return rem > BigInt(0) ? rem : BigInt(0);
}
