import { enginePriceToNumber } from "@/lib/market/engine-price-decimal";
import { pairLabelFromCode } from "@/lib/market/pair";
import { apiBigIntToString, parseApiBigInt, type ApiBigInt } from "@/lib/utils/coerce-bigint";
import type { OrdersHistoryRsp, OrdersRsp, OrdersTradeHistoryRsp } from "@/lib/market/orders-dto";

export const ORDER_SIDE_BUY = 1;
export const ORDER_SIDE_SELL = 2;

/** Mirrors `exchange.orbix.components.constants.MatchedSide`. */
export const MATCHED_SIDE_TAKER = 1;
export const MATCHED_SIDE_MAKER = 2;

const BASE_QUANTITY_DECIMALS = 18;

export function orderSideToLabel(side: number): "buy" | "sell" | null {
  if (side === ORDER_SIDE_BUY) return "buy";
  if (side === ORDER_SIDE_SELL) return "sell";
  return null;
}

export function matchedSideToLabel(side: number): "maker" | "taker" | null {
  if (side === MATCHED_SIDE_MAKER) return "maker";
  if (side === MATCHED_SIDE_TAKER) return "taker";
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
  ns: "spot" | "perps",
  status: string,
  t: (key: string) => string
): string {
  if (status === "New") return t(`${ns}.statusOpen`);
  if (status === "Cancelling") return t(`${ns}.cancelling`);
  return status;
}

export function formatOrderHistoryStatus(
  ns: "spot" | "perps",
  status: string,
  t: (key: string) => string
): string {
  if (status === "Completed") return t(`${ns}.statusFilled`);
  if (status === "Canceled") return t(`${ns}.statusCancelled`);
  if (status === "PartialCanceled") return t(`${ns}.statusPartial`);
  return status;
}

export type OpenOrderRow = {
  orderId: string;
  pairCode: string;
  pairId: number;
  placedAt: number;
  pairLabel: string;
  side: "buy" | "sell" | null;
  price: number;
  quantity: number;
  /** Quote notional: price × quantity. */
  total: number;
  /** Isolated margin (quote, same decimals as fee/amount). Perps open orders. */
  margin?: number;
  /** Perps: isolated leverage ≈ notional / margin. */
  leverage?: number | null;
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
  /** Order quote notional: price × quantity. */
  total: number | null;
  /** Perps: locked margin (quote decimals). */
  lockedMargin?: number;
  /** Perps: filled quote notional = averagePrice × filledQuantity. */
  filledValue?: number | null;
  /** Perps: isolated leverage ≈ notional / margin. */
  leverage?: number | null;
  status: string;
  fee: number;
  placedAt: number;
  completedAt: number;
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

export function formatTradeStatus(
  ns: "spot" | "perps",
  status: string,
  t: (key: string) => string
): string {
  if (status === "Matched") return t(`${ns}.tradeStatusMatched`);
  if (status === "Settling") return t(`${ns}.tradeStatusSettling`);
  if (status === "Settled") return t(`${ns}.tradeStatusSettled`);
  if (status === "NotFound") return t(`${ns}.tradeStatusNotFound`);
  return status;
}

export type TradeHistoryRow = {
  orderId: string;
  pairLabel: string;
  placeSide: "buy" | "sell" | null;
  /** Maker / taker role in the match (`matchedSide`). */
  matchedSide: "maker" | "taker" | null;
  price: number;
  quantity: number;
  /** Quote notional: price × quantity (same as order-history filled). */
  filledValue: number;
  /** Perps: isolated leverage ≈ (amount × price) / margin. */
  leverage?: number | null;
  fee: number;
  tradeTime: number;
  tradeStatus: string;
  txHash: string;
  enginePriceDecimal: number;
};

export function ordersTradeHistoryRspToRow(trade: OrdersTradeHistoryRsp): TradeHistoryRow {
  const price = enginePriceToNumber(trade.enginePrice, trade.enginePriceDecimal);
  const quantity = formatOrderQuantity(trade.quantity);
  return {
    orderId: formatOrderId(trade.orderId),
    pairLabel: pairLabelFromCode(trade.pairCode),
    placeSide: orderSideToLabel(trade.placeSide),
    matchedSide: matchedSideToLabel(trade.matchedSide),
    price,
    quantity,
    filledValue: price * quantity,
    fee: formatOrderFee(trade.fee),
    tradeTime: trade.tradeTime,
    tradeStatus: trade.tradeStatus,
    txHash: trade.txHash,
    enginePriceDecimal: trade.enginePriceDecimal,
  };
}
