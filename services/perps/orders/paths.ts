/** Perps orders REST path constants (gateway: `/api/v1/perps/orders/...`). */
export const PerpsOrdersApi = {
  pairByTokens: (baseToken: string, quoteToken: string) =>
    `/perps/orders/pairs/${encodeURIComponent(baseToken)}/${encodeURIComponent(quoteToken)}`,
  orderSalt: "/perps/orders/orders/salt",
  ordersPlace: "/perps/orders/orders/place",
  ordersCancel: "/perps/orders/orders/cancel",
  ordersList: "/perps/orders/orders/list",
  positionsList: "/perps/orders/positions/list",
  positionHistoryPagination: "/perps/orders/positions-history/pagination",
  ordersHistoryPagination: "/perps/orders/orders-history/pagination",
  ordersTradeHistoryPagination: "/perps/orders/orders-trade-history/pagination",
  ordersTradeHistoryList: "/perps/orders/orders-trade-history/list",
  ordersCancelHistoryList: "/perps/orders/orders-cancel-history/list",
  positionCashLedgerList: "/perps/orders/position-cash-ledger/list",
  positionMarginEventsList: "/perps/orders/position-margin-events/list",
  fundingSettlementsList: "/perps/orders/funding-settlements/list",
  userBalance: "/perps/orders/user-balances/balance",
  userPairs: "/perps/orders/userPairs/pairs",
  userPairsAdd: "/perps/orders/userPairs/add",
  userPairsDelete: "/perps/orders/userPairs/delete",
  userPairsReorder: "/perps/orders/userPairs/reorder",
  withdrawalsApply: "/perps/orders/withdrawals/apply",
} as const;
