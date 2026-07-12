/** Spot orders REST path constants. */
export const SpotOrdersApi = {
  pairByTokens: (baseToken: string, quoteToken: string) =>
    `/orders/pairs/${encodeURIComponent(baseToken)}/${encodeURIComponent(quoteToken)}`,
  orderSalt: "/orders/orders/salt",
  ordersPagination: "/orders/orders/pagination",
  ordersHistoryPagination: "/orders/orders-history/pagination",
  ordersTradeHistoryPagination: "/orders/orders-trade-history/pagination",
  ordersPlace: "/orders/orders/place",
  userBalance: "/orders/user-balances/balance",
  userBalancesPair: "/orders/user-balances/balances-pair",
  withdrawalsApply: "/orders/withdrawals/apply",
} as const;
