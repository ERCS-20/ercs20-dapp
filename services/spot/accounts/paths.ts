/** Spot accounts REST path constants. */
export const SpotAccountsApi = {
  userBalance: "/spot/accounts/user-balances/balance",
  userBalancesList: "/spot/accounts/user-balances/list",
  depositsPagination: "/spot/accounts/deposits/pagination",
  withdrawalsPagination: "/spot/accounts/withdrawals/pagination",
  withdrawalsDetail: "/spot/accounts/withdrawals/detail",
  accountLedgerPagination: "/spot/accounts/accountLedger/pagination",
} as const;
