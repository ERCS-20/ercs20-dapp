import type { PaginationCondition, PaginationRepertory } from "@/lib/api/pagination";
import type { ApiBigInt } from "@/lib/utils/coerce-bigint";

/** Mirrors `exchange.orbix.spot.market.store.dto.PairRsp`. */
export type MarketPairRsp = {
  pairId: number;
  code: string;
  open: ApiBigInt;
  close: ApiBigInt;
  /** Matching-engine price scale (÷ 10^enginePriceDecimal). Omitted on some API versions. */
  enginePriceDecimal?: number;
  engine_price_decimal?: number;
};

/** Mirrors `PaginationCondition<Void>` for pairs pagination. */
export type MarketPairsPaginationReq = PaginationCondition<Record<string, never>>;

export type MarketPairsPaginationRsp = PaginationRepertory<MarketPairRsp>;

/** Mirrors `exchange.orbix.spot.market.store.dto.PairsUserReq`. */
export type MarketPairsUserReq = {
  pairIds: number[];
};

/** Mirrors `exchange.orbix.spot.market.store.dto.PairsRsp`. */
export type MarketPairsRsp = {
  pairs: MarketPairRsp[];
};

/** Mirrors `exchange.orbix.spot.market.store.dto.KlineCurrentDayReq`. */
export type KlineCurrentDayReq = {
  pairId: number;
};

/** Mirrors `exchange.orbix.spot.market.store.dto.KlineListReq`. */
export type KlineListReq = {
  pairId: number;
  interval: string;
  /** Default server-side (`kline-first-screen-limit`, typically 200). */
  limit?: number;
  /** ISO-8601 UTC; fetch bars with `openTime` strictly before this instant. */
  beforeOpenTime?: string;
};

/** Mirrors `exchange.orbix.spot.market.store.dto.KlineListRsp`. */
export type KlineListRsp = {
  pairId: number;
  bars: MarketKlineRsp[];
  /** Close of the latest closed bar before this page's oldest bar; null if none. */
  prevClose: ApiBigInt | null;
};

/** Mirrors `exchange.orbix.spot.components.market.entity.MarketKline`. */
export type MarketKlineRsp = {
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

/** Mirrors `exchange.orbix.spot.components.market.entity.MarketPriceAndQuantity`. */
export type MarketPriceAndQuantity = {
  price: number;
  quantity: ApiBigInt;
};

/** Mirrors `exchange.orbix.spot.components.market.entity.MarketBidsAndAsks`. */
export type MarketBidsAndAsks = {
  bids: MarketPriceAndQuantity[];
  asks: MarketPriceAndQuantity[];
};

/** Mirrors `exchange.orbix.spot.market.store.dto.OrderBookListRsp`. */
export type MarketOrderBookListRsp = {
  sequence: number;
  bidsAndAsks: MarketBidsAndAsks;
};

/** Mirrors `exchange.orbix.spot.components.market.entity.MarketTrade`. */
export type MarketTrade = {
  tradeTime: number;
  /** {@link OrderSide} — 1 buy, 2 sell. */
  side: number;
  price: ApiBigInt;
  quantity: ApiBigInt;
};

/** Mirrors `exchange.orbix.spot.market.store.dto.TradeListRsp`. */
export type MarketTradeListRsp = {
  trades: (MarketTrade | null)[];
  reverseFromIndex: number;
};
