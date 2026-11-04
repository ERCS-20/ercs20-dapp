import type { ApiBigInt } from "@/lib/utils/coerce-bigint";

/** Perps market API types — shared DTOs live in `@/lib/market/dto`. */
export type * from "@/lib/market/dto";

/** `POST /perps/market/store/mark/list` row. `markX18` is quote/base × 1e18. `timestamp` is Unix seconds. */
export type MarketMark = {
  pairId: number;
  markX18: ApiBigInt;
  timestamp: ApiBigInt;
  blockNumber: ApiBigInt;
  blockLogIndex: number;
};

export type MarketMarkListRsp = {
  marks: MarketMark[];
};

/** `fundingIndex` WebSocket payload. `value` is the global funding index. `timestamp` is Unix seconds. */
export type MarketFundingIndex = {
  pairId: number;
  value: ApiBigInt;
  timestamp: ApiBigInt;
  blockNumber: ApiBigInt;
  blockLogIndex: number;
};

/** `GET /perps/market/store/funding-rate/{pairId}`. `timestamp` is Unix seconds. */
export type MarketFundingRateRsp = {
  positive: boolean;
  ratePerSecondX18: ApiBigInt;
  timestamp: ApiBigInt;
  blockNumber: ApiBigInt;
  blockLogIndex: number;
};
