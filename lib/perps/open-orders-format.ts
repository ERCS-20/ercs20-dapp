import {
  formatOpenOrderStatus as formatOpen,
  formatOrderHistoryStatus as formatHistory,
  formatTradeStatus as formatTrade,
} from "@/lib/market/open-orders-format";

export {
  formatOrderFee,
  formatOrderId,
  formatOrderQuantity,
  orderAveragePrice,
  orderFillPercent,
  orderFilledBaseQuantity,
  orderSideToLabel,
  ordersHistoryRspToRow,
  ordersRspToOpenOrderRow,
  ordersTradeHistoryRspToRow,
  ORDER_SIDE_BUY,
  ORDER_SIDE_SELL,
  type OpenOrderRow,
  type OrderHistoryRow,
  type TradeHistoryRow,
} from "@/lib/market/open-orders-format";

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
