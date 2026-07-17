/** Spot market store REST path constants (gateway prefix `/api/v1`). */
export const SpotMarketApi = {
  pairsPagination: "/market/store/pairs/pagination",
  pairsUserPairs: "/market/store/pairs/user-pairs",
  klineCurrentDay: "/market/store/kline/current-day",
  klineList: "/market/store/kline/list",
  trades: (pairId: number) => `/market/store/trades/${pairId}`,
  orderBook: (pairId: number) => `/market/store/order-book/${pairId}`,
} as const;
