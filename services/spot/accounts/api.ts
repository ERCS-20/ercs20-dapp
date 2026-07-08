import { request } from "@/lib/api/request";
import { resolveSpotBalanceTokenAddress } from "@/lib/tokens/spot-balance-token";
import { SpotAccountsApi } from "@/services/spot/accounts/paths";
import type {
  AccountLedgerPaginationReq,
  AccountLedgerPaginationRsp,
  DepositsPaginationReq,
  DepositsPaginationRsp,
  UserBalancesReq,
  UserBalancesRsp,
  WithdrawalsDetailReq,
  WithdrawalsPaginationReq,
  WithdrawalsPaginationRsp,
  WithdrawalsRsp,
} from "@/services/spot/accounts/types";

/** POST /users/user-balances/balance — `userId` from gateway JWT headers. */
export function getUserBalance(req: UserBalancesReq) {
  const tokenAddress = resolveSpotBalanceTokenAddress(req.tokenAddress);
  if (!tokenAddress) {
    return Promise.reject(new Error("Missing token address for balance query"));
  }
  return request.post<UserBalancesRsp>(SpotAccountsApi.userBalance, {
    tokenAddress: tokenAddress.toLowerCase(),
  });
}

/** POST /users/user-balances/list — `userId` from gateway JWT headers. */
export function listUserBalances() {
  return request.post<UserBalancesRsp[]>(SpotAccountsApi.userBalancesList);
}

/** POST /users/deposits/pagination — `userId` from gateway JWT headers. */
export function paginationDeposits(req: DepositsPaginationReq) {
  return request.post<DepositsPaginationRsp>(SpotAccountsApi.depositsPagination, req);
}

/** POST /users/withdrawals/pagination — `userId` from gateway JWT headers. */
export function paginationWithdrawals(req: WithdrawalsPaginationReq) {
  return request.post<WithdrawalsPaginationRsp>(SpotAccountsApi.withdrawalsPagination, req);
}

/** POST /users/withdrawals/detail — `userId` from gateway JWT headers. */
export function getWithdrawalDetail(req: WithdrawalsDetailReq) {
  return request.post<WithdrawalsRsp>(SpotAccountsApi.withdrawalsDetail, req);
}

/** POST /users/accountLedger/pagination — `userId` from gateway JWT headers. */
export function paginationAccountLedger(req: AccountLedgerPaginationReq) {
  const tokenAddress = resolveSpotBalanceTokenAddress(req.condition?.tokenAddress);
  if (!tokenAddress) {
    return Promise.reject(new Error("Missing token address for account ledger query"));
  }

  return request.post<AccountLedgerPaginationRsp>(SpotAccountsApi.accountLedgerPagination, {
    ...req,
    condition: {
      ...req.condition,
      tokenAddress: tokenAddress.toLowerCase(),
      ...(req.condition?.bizType ? { bizType: req.condition.bizType } : {}),
      ...(req.condition?.bizSubType ? { bizSubType: req.condition.bizSubType } : {}),
    },
  });
}
