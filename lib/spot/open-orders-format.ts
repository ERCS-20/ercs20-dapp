import { enginePriceToNumber } from "@/lib/spot/engine-price-decimal";
import { pairLabelFromCode } from "@/lib/spot/pair-api";
import { apiBigIntToString, parseApiBigInt, type ApiBigInt } from "@/lib/utils/coerce-bigint";
import type { OrdersHistoryRsp, OrdersRsp, OrdersTradeHistoryRsp } from "@/services/spot/orders/types";

export const ORDER_SIDE_BUY = 1;
export const ORDER_SIDE_SELL = 2;

const BASE_QUANTITY_DECIMALS = 18;

export function orderSideToLabel(side: number): "buy" | "sell" | null {
  if (side === ORDER_SIDE_BUY) return "buy";
  if (side === ORDER_SIDE_SELL) return "sell";
  return null;
}

export function orderFillPercent(
  filledMakerAmount: ApiBigInt,
  makerAmount: ApiBigInt
): number {
  const filled = parseApiBigInt(filledMakerAmount) ?? BigInt(0);
  const total = parseApiBigInt(makerAmount) ?? BigInt(0);
  if (total <= BigInt(0)) return 0;
  return Number((filled * BigInt(10_000)) / total) / 100;
}

export function formatOrderQuantity(raw: ApiBigInt): number {
  const bi = parseApiBigInt(raw) ?? BigInt(0);
  return Number(bi) / 10 ** BASE_QUANTITY_DECIMALS;
}

/**
 * Filled base quantity by side.
 * BUY: filledTakerAmount (taker = base); SELL: filledMakerAmount (maker = base).
 */
export function orderFilledBaseQuantity(
  side: number,
  filledMakerAmount: ApiBigInt,
  filledTakerAmount: ApiBigInt
): number {
  const raw = side === ORDER_SIDE_BUY ? filledTakerAmount : filledMakerAmount;
  return formatOrderQuantity(raw);
}

export function formatOrderId(salt: ApiBigInt): string {
  return apiBigIntToString(salt);
}

export function formatOrderFee(raw: ApiBigInt): number {
  const bi = parseApiBigInt(raw) ?? BigInt(0);
  return Number(bi) / 10 ** BASE_QUANTITY_DECIMALS;
}

/**
 * Average fill price from filled maker/taker amounts (mirrors backend `Price.calculateEnginePrice`).
 * BUY: quote/base = filledMaker / filledTaker; SELL: quote/base = filledTaker / filledMaker.
 */
export function orderAveragePrice(
  side: number,
  filledMakerAmount: ApiBigInt,
  filledTakerAmount: ApiBigInt,
  enginePriceDecimal: number
): number | null {
  const filledMaker = parseApiBigInt(filledMakerAmount) ?? BigInt(0);
  const filledTaker = parseApiBigInt(filledTakerAmount) ?? BigInt(0);
  if (filledMaker <= BigInt(0) || filledTaker <= BigInt(0)) return null;

  const numerator = side === ORDER_SIDE_BUY ? filledMaker : filledTaker;
  const denominator = side === ORDER_SIDE_BUY ? filledTaker : filledMaker;

  const price18 = (numerator * BigInt(10) ** BigInt(18)) / denominator;
  const scaleExp = 18 - enginePriceDecimal;
  if (scaleExp < 0) return null;

  const enginePrice =
    scaleExp === 0 ? price18 : price18 / (BigInt(10) ** BigInt(scaleExp));

  return enginePriceToNumber(enginePrice, enginePriceDecimal);
}

export function formatOpenOrderStatus(
  status: string,
  t: (key: string) => string
): string {
  if (status === "New") return t("spot.statusOpen");
  if (status === "Cancelling") return t("spot.cancelling");
  return status;
}

export function formatOrderHistoryStatus(
  status: string,
  t: (key: string) => string
): string {
  if (status === "Completed") return t("spot.statusFilled");
  if (status === "Canceled") return t("spot.statusCancelled");
  if (status === "PartialCanceled") return t("spot.statusPartial");
  return status;
}

export type OpenOrderRow = {
  orderId: string;
  pairCode: string;
  pairId: number;
  placedAt: string;
  pairLabel: string;
  side: "buy" | "sell" | null;
  price: number;
  quantity: number;
  /** Quote notional: price × quantity. */
  total: number;
  fillPercent: number;
  status: string;
  enginePriceDecimal: number;
};

export function ordersRspToOpenOrderRow(order: OrdersRsp): OpenOrderRow {
  const price = enginePriceToNumber(order.enginePrice, order.enginePriceDecimal);
  const quantity = formatOrderQuantity(order.quantity);
  return {
    orderId: String(order.id),
    pairCode: order.pairCode,
    pairId: order.pairId,
    placedAt: order.placedAt,
    pairLabel: pairLabelFromCode(order.pairCode),
    side: orderSideToLabel(order.side),
    price,
    quantity,
    total: price * quantity,
    fillPercent: orderFillPercent(order.filledMakerAmount, order.makerAmount),
    status: order.status,
    enginePriceDecimal: order.enginePriceDecimal,
  };
}

export type OrderHistoryRow = {
  orderId: string;
  pairLabel: string;
  side: "buy" | "sell" | null;
  /** Limit / order engine price. */
  price: number;
  averagePrice: number | null;
  quantity: number;
  /** Filled base qty: buy ← filledTaker, sell ← filledMaker. */
  filledQuantity: number;
  /** Quote notional: averagePrice × filledQuantity when filled. */
  total: number | null;
  status: string;
  fee: number;
  placedAt: string;
  completedAt: string;
  enginePriceDecimal: number;
};

export function ordersHistoryRspToRow(order: OrdersHistoryRsp): OrderHistoryRow {
  const price = enginePriceToNumber(order.enginePrice, order.enginePriceDecimal);
  const averagePrice = orderAveragePrice(
    order.side,
    order.filledMakerAmount,
    order.filledTakerAmount,
    order.enginePriceDecimal
  );
  const quantity = formatOrderQuantity(order.quantity);
  const filledQuantity = orderFilledBaseQuantity(
    order.side,
    order.filledMakerAmount,
    order.filledTakerAmount
  );
  return {
    orderId: String(order.id),
    pairLabel: pairLabelFromCode(order.pairCode),
    side: orderSideToLabel(order.side),
    price,
    averagePrice,
    quantity,
    filledQuantity,
    total: averagePrice != null ? averagePrice * filledQuantity : null,
    status: order.status,
    fee: formatOrderFee(order.fee),
    placedAt: order.placedAt,
    completedAt: order.completedAt,
    enginePriceDecimal: order.enginePriceDecimal,
  };
}

export function formatTradeStatus(status: string, t: (key: string) => string): string {
  if (status === "Matched") return t("spot.tradeStatusMatched");
  if (status === "Settling") return t("spot.tradeStatusSettling");
  if (status === "Settled") return t("spot.tradeStatusSettled");
  if (status === "NotFound") return t("spot.tradeStatusNotFound");
  return status;
}

export type TradeHistoryRow = {
  orderId: string;
  pairLabel: string;
  placeSide: "buy" | "sell" | null;
  price: number;
  quantity: number;
  tradeTime: string;
  tradeStatus: string;
  txHash: string;
  enginePriceDecimal: number;
};

export function ordersTradeHistoryRspToRow(trade: OrdersTradeHistoryRsp): TradeHistoryRow {
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
