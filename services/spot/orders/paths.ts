/** Spot orders REST path constants. */
export const SpotOrdersApi = {
  pairByTokens: (baseToken: string, quoteToken: string) =>
    `/spot/orders/pairs/${encodeURIComponent(baseToken)}/${encodeURIComponent(quoteToken)}`,
  orderSalt: "/spot/orders/orders/salt",
  ordersPagination: "/spot/orders/orders/pagination",
  ordersHistoryPagination: "/spot/orders/orders-history/pagination",
  ordersTradeHistoryPagination: "/spot/orders/orders-trade-history/pagination",
  ordersPlace: "/spot/orders/orders/place",
  ordersCancel: "/spot/orders/orders/cancel",
  userBalance: "/spot/orders/user-balances/balance",
  userBalancesPair: "/spot/orders/user-balances/balances-pair",
  withdrawalsApply: "/spot/orders/withdrawals/apply",
} as const;
