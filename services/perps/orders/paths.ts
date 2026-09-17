/** Perps orders REST path constants (gateway: `/api/v1/perps/orders/...`). */
export const PerpsOrdersApi = {
  pairByTokens: (baseToken: string, quoteToken: string) =>
    `/perps/orders/pairs/${encodeURIComponent(baseToken)}/${encodeURIComponent(quoteToken)}`,
  orderSalt: "/perps/orders/orders/salt",
  ordersPagination: "/perps/orders/orders/pagination",
  ordersHistoryPagination: "/perps/orders/orders-history/pagination",
  ordersTradeHistoryPagination: "/perps/orders/orders-trade-history/pagination",
  ordersPlace: "/perps/orders/orders/place",
  ordersCancel: "/perps/orders/orders/cancel",
  userBalance: "/perps/orders/user-balances/balance",
  userBalancesPair: "/perps/orders/user-balances/balances-pair",
  withdrawalsApply: "/perps/orders/withdrawals/apply",
} as const;
