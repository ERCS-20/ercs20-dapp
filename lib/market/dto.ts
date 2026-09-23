import type { PaginationCondition, PaginationRepertory } from "@/lib/api/pagination";
import type { ApiBigInt } from "@/lib/utils/coerce-bigint";

/** Shared market API DTOs (spot + perps store shapes are identical). */

export type MarketPairRsp = {
  pairId: number;
  code: string;
  sequence?: number;
  open: ApiBigInt;
  close: ApiBigInt;
  /** Matching-engine price scale (÷ 10^enginePriceDecimal). Omitted on some API versions. */
  enginePriceDecimal?: number;
  engine_price_decimal?: number;
};

export type MarketPairsPaginationReq = PaginationCondition<Record<string, never>>;

export type MarketPairsPaginationRsp = PaginationRepertory<MarketPairRsp>;

export type MarketPairsUserReq = {
  pairIds: number[];
};

export type MarketPairsRsp = {
  pairs: MarketPairRsp[];
};

export type KlineCurrentDayReq = {
  pairId: number;
};

export type KlineListReq = {
  pairId: number;
  interval: string;
  /** ISO-8601 UTC; fetch bars with `openTime` strictly before this instant. */
  beforeOpenTime?: string;
};

export type KlineListRsp = {
  pairId: number;
  bars: MarketKlineRsp[];
  /** Close of the latest closed bar before this page's oldest bar; null if none. */
  prevClose: ApiBigInt | null;
};

export type MarketKlineRsp = {
  sequence: number;
  interval: string;
  openTime: number;
  open: ApiBigInt;
  close: ApiBigInt;
  high: ApiBigInt;
  low: ApiBigInt;
  baseVolume: ApiBigInt;
  quoteVolume: ApiBigInt;
  tradeCount: number;
  closedBar: boolean;
};

export type MarketKlineCurrentDayRsp = {
  /** Yesterday close (UTC-0 previous day's D1 close). */
  prevClose: ApiBigInt;
  /** Today D1 bar (may be null if no data). */
  current: MarketKlineRsp | null;
};

export type MarketPriceAndQuantity = {
  price: number;
  quantity: ApiBigInt;
};

export type MarketBidsAndAsksRsp = {
  sequence: number;
  bids: MarketPriceAndQuantity[];
  asks: MarketPriceAndQuantity[];
};

export type MarketTrade = {
  tradeTime: number;
  /** OrderSide — 1 buy, 2 sell. */
  side: number;
  price: ApiBigInt;
  quantity: ApiBigInt;
};

export type MarketTradeListRsp = {
  /** Matching-engine trade sequence at snapshot time (same space as WS envelope). */
  sequence: number;
  trades: (MarketTrade | null)[];
  /**
   * Ring cursor for REST snapshots. After WS merges, may be `null` —
   * then `trades` is a dense newest-first list.
   */
  reverseFromIndex: number | null;
};

export type MarketWsChannel = "kline" | "orderbook" | "trade" | "pairs";

export type MarketWsClientMessage = {
  op: "ping" | "subscribe" | "unsubscribe";
  channel?: MarketWsChannel;
  /** Required for kline / orderbook / trade; omit for `pairs`. */
  pairId?: number;
  interval?: string;
};

export type MarketWsControlMessage = {
  op: "pong" | "error";
  code?: string;
  message?: string;
};

export type MarketWsPushMessage = {
  channel: MarketWsChannel;
  /** Business pairId; for `pairs` channel this is always `0` (unused). */
  pairId: number;
  /** Present on older envelopes; newer channels carry sequence inside `data`. */
  sequence?: number;
  data: unknown;
};

export type MarketWsTradePushMessage = MarketWsPushMessage & {
  channel: "trade";
  data: MarketTrade[];
};

export type MarketWsPairPrice = {
  pairId: number;
  sequence: number;
  open: ApiBigInt;
  close: ApiBigInt;
};

export type MarketWsPairsPushMessage = MarketWsPushMessage & {
  channel: "pairs";
  data: MarketWsPairPrice[];
};

export type MarketWsOrderBookDiff = {
  bids?: MarketPriceAndQuantity[];
  asks?: MarketPriceAndQuantity[];
};
