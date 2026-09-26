/** Perps orders REST path constants (gateway: `/api/v1/perps/orders/...`). */
export const PerpsOrdersApi = {
  pairByTokens: (baseToken: string, quoteToken: string) =>
    `/perps/orders/pairs/${encodeURIComponent(baseToken)}/${encodeURIComponent(quoteToken)}`,
  orderSalt: "/perps/orders/orders/salt",
  ordersPlace: "/perps/orders/orders/place",
  ordersCancel: "/perps/orders/orders/cancel",
  ordersList: "/perps/orders/orders/list",
  positionsList: "/perps/orders/positions/list",
  ordersHistoryPagination: "/perps/orders/orders-history/pagination",
  ordersTradeHistoryPagination: "/perps/orders/orders-trade-history/pagination",
  userBalance: "/perps/orders/user-balances/balance",
  userPairs: "/perps/orders/userPairs/pairs",
  userPairsAdd: "/perps/orders/userPairs/add",
  userPairsDelete: "/perps/orders/userPairs/delete",
  userPairsReorder: "/perps/orders/userPairs/reorder",
  withdrawalsApply: "/perps/orders/withdrawals/apply",
} as const;
