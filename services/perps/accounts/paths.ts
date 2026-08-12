/** Spot-style paths under `/perps/accounts/...` (gateway: `/api/v1/perps/accounts/...`). */
export const PerpsAccountsApi = {
  userBalance: "/perps/accounts/user-balances/balance",
  userBalancesList: "/perps/accounts/user-balances/list",
  depositsPagination: "/perps/accounts/deposits/pagination",
  withdrawalsPagination: "/perps/accounts/withdrawals/pagination",
  withdrawalsDetail: "/perps/accounts/withdrawals/detail",
  accountLedgerPagination: "/perps/accounts/accountLedger/pagination",
} as const;
