/** Spot market store REST path constants (gateway prefix `/api/v1`). */
export const PerpsMarketApi = {
  pairsPagination: "/perps/market/store/pairs/pagination",
  pairsUserPairs: "/perps/market/store/pairs/user-pairs",
  klineCurrentDay: "/perps/market/store/kline/current-day",
  klineList: "/perps/market/store/kline/list",
  trades: (pairId: number) => `/perps/market/store/trades/${pairId}`,
  orderBook: (pairId: number) => `/perps/market/store/order-book/${pairId}`,
} as const;
