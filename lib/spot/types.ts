export type SpotSide = "buy" | "sell";

export type SpotOrderType = "limit";

export type SpotOrderStatus = "open" | "filled" | "cancelled" | "partial";

export type SpotCancelStatus = "normal" | "cancelling" | "cancelClaim";

export type SpotPair = {
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

export type SpotMarketStats = {
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

export type SpotOrderBook = {
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
  midPrice: number;
  spread: number;
  spreadPct: number;
};

export type SpotOrder = {
  id: string;
  orderId: string;
  pairLabel: string;
  side: SpotSide;
  price: number;
  amount: number;
  filled: number;
  average: number;
  fee: number;
  status: SpotOrderStatus;
  cancelStatus: SpotCancelStatus;
  txHash: string;
  createdAt: number;
};

export type SpotMarketTrade = {
  id: string;
  price: number;
  quantity: number;
  isBuy: boolean;
  time: number;
};

export type SpotUserTrade = {
  id: string;
  pairLabel: string;
  side: SpotSide;
  price: number;
  quantity: number;
  fee: number;
  txHash: string;
  time: number;
};

export type ChartTimeframe = "1m" | "5m" | "1h" | "1D";

export type SpotOrderDraft = {
  price: string;
  quantity: string;
};
