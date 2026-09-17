export type PerpsSide = "buy" | "sell";

export type PerpsOrderType = "limit";

export type PerpsOrderStatus = "open" | "filled" | "cancelled" | "partial";

export type PerpsCancelStatus = "normal" | "cancelling" | "cancelClaim";

export type PerpsPair = {
  pairId?: number;
  enginePriceDecimal?: number;
  baseSymbol: string;
  baseName: string;
  baseAddress: `0x${string}`;
  quoteSymbol: string;
  quoteAddress: `0x${string}`;
  pairCode: string;
  /** Minimum order total in quote token base units (18 decimals). */
  minTradeAmount?: bigint;
};

export type PerpsMarketStats = {
  lastPrice: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  volumeBase: number;
};

export type OrderBookLevel = {
  price: number;
  size: number;
};

export type PerpsOrderBook = {
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
  midPrice: number;
  spread: number;
  spreadPct: number;
};

export type PerpsOrder = {
  id: string;
  orderId: string;
  pairLabel: string;
  side: PerpsSide;
  price: number;
  amount: number;
  filled: number;
  average: number;
  fee: number;
  status: PerpsOrderStatus;
  cancelStatus: PerpsCancelStatus;
  txHash: string;
  createdAt: number;
};

export type PerpsMarketTrade = {
  id: string;
  price: number;
  quantity: number;
  isBuy: boolean;
  time: number;
};

export type PerpsUserTrade = {
  id: string;
  pairLabel: string;
  side: PerpsSide;
  price: number;
  quantity: number;
  fee: number;
  txHash: string;
  time: number;
};

export type ChartInterval =
  | "1s"
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "1d"
  | "1w"
  | "1M"
  | "1y";

/** @deprecated Use {@link ChartInterval}. */
export type ChartTimeframe = ChartInterval;

export type PerpsOrderDraft = {
  price: string;
  quantity: string;
};
