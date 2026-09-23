/** Shared spot/perps trading UI domain types. */

export type OrderSide = "buy" | "sell";

export type OrderType = "limit";

export type OrderStatus = "open" | "filled" | "cancelled" | "partial";

export type CancelStatus = "normal" | "cancelling" | "cancelClaim";

export type TradingPair = {
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

export type MarketStats = {
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

export type OrderBookSnapshot = {
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
  midPrice: number;
  spread: number;
  spreadPct: number;
};

export type MarketTradeRow = {
  id: string;
  price: number;
  quantity: number;
  isBuy: boolean;
  time: number;
};

export type OrderDraft = {
  price: string;
  quantity: string;
};
