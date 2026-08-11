/** Spot market store REST path constants (gateway prefix `/api/v1`). */
export const SpotMarketApi = {
  pairsPagination: "/spot/market/store/pairs/pagination",
  pairsUserPairs: "/spot/market/store/pairs/user-pairs",
  klineCurrentDay: "/spot/market/store/kline/current-day",
  klineList: "/spot/market/store/kline/list",
  trades: (pairId: number) => `/spot/market/store/trades/${pairId}`,
  orderBook: (pairId: number) => `/spot/market/store/order-book/${pairId}`,
} as const;
