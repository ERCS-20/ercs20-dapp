/** Spot user balances REST path constants. */
export const SpotAccountsApi = {
  userBalance: "/users/user-balances/balance",
  userBalancesList: "/users/user-balances/list",
  depositsPagination: "/users/deposits/pagination",
  withdrawalsPagination: "/users/withdrawals/pagination",
  withdrawalsDetail: "/users/withdrawals/detail",
  accountLedgerPagination: "/users/accountLedger/pagination",
} as const;
