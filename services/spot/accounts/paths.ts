/** Spot accounts REST path constants. */
export const SpotAccountsApi = {
  userBalance: "/spot/accounts/user-balances/balance",
  userBalancesList: "/spot/accounts/user-balances/list",
  depositsPagination: "/spot/accounts/deposits/pagination",
  withdrawalsPagination: "/spot/accounts/withdrawals/pagination",
  withdrawalsDetail: "/spot/accounts/withdrawals/detail",
  accountLedgerPagination: "/spot/accounts/accountLedger/pagination",
  userPairs: "/spot/accounts/userPairs/pairs",
  userPairsAdd: "/spot/accounts/userPairs/add",
  userPairsDelete: "/spot/accounts/userPairs/delete",
  userPairsReorder: "/spot/accounts/userPairs/reorder",
} as const;
