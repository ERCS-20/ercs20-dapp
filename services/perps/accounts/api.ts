import { request } from "@/lib/api/request";
import { getPerpsNativeTokenAddress } from "@/lib/config/perps-native-token";
import { PerpsAccountsApi } from "@/services/perps/accounts/paths";
import type {
  PerpsAccountLedgerPaginationReq,
  PerpsAccountLedgerPaginationRsp,
  PerpsDepositsPaginationReq,
  PerpsDepositsPaginationRsp,
  PerpsUserBalancesReq,
  PerpsUserBalancesRsp,
  PerpsWithdrawalsDetailReq,
  PerpsWithdrawalsPaginationReq,
  PerpsWithdrawalsPaginationRsp,
  PerpsWithdrawalsRsp,
  UserPairAddReq,
  UserPairDeleteReq,
  UserPairsReorderReq,
  UserPairsRsp,
} from "@/services/perps/accounts/types";

/**
 * POST /perps/accounts/user-balances/balance — `userId` from gateway JWT headers.
 * Omit `tokenAddress` to query the configured native USDC ledger token.
 */
export function getPerpsUserBalance(req?: Partial<PerpsUserBalancesReq>) {
  const tokenAddress = (
    req?.tokenAddress?.trim() || getPerpsNativeTokenAddress()
  ).toLowerCase();
  return request.post<PerpsUserBalancesRsp>(PerpsAccountsApi.userBalance, {
    tokenAddress,
  });
}

/** POST /perps/accounts/user-balances/list — `userId` from gateway JWT headers. */
export function listPerpsUserBalances() {
  return request.post<PerpsUserBalancesRsp[]>(PerpsAccountsApi.userBalancesList);
}

/** POST /perps/accounts/deposits/pagination — `userId` from gateway JWT headers. */
export function paginationPerpsDeposits(req: PerpsDepositsPaginationReq) {
  return request.post<PerpsDepositsPaginationRsp>(PerpsAccountsApi.depositsPagination, req);
}

/** POST /perps/accounts/withdrawals/pagination — `userId` from gateway JWT headers. */
export function paginationPerpsWithdrawals(req: PerpsWithdrawalsPaginationReq) {
  return request.post<PerpsWithdrawalsPaginationRsp>(
    PerpsAccountsApi.withdrawalsPagination,
    req
  );
}

/** POST /perps/accounts/withdrawals/detail — `userId` from gateway JWT headers. */
export function getPerpsWithdrawalDetail(req: PerpsWithdrawalsDetailReq) {
  return request.post<PerpsWithdrawalsRsp>(PerpsAccountsApi.withdrawalsDetail, req);
}

/** POST /perps/accounts/accountLedger/pagination — `userId` from gateway JWT headers. */
export function paginationPerpsAccountLedger(req: PerpsAccountLedgerPaginationReq) {
  const tokenAddress = req.condition?.tokenAddress?.trim().toLowerCase();
  if (!tokenAddress) {
    return Promise.reject(new Error("Missing token address for account ledger query"));
  }

  return request.post<PerpsAccountLedgerPaginationRsp>(PerpsAccountsApi.accountLedgerPagination, {
    ...req,
    condition: {
      ...req.condition,
      tokenAddress,
      ...(req.condition?.bizType ? { bizType: req.condition.bizType } : {}),
      ...(req.condition?.bizSubType ? { bizSubType: req.condition.bizSubType } : {}),
    },
  });
}

/** POST /perps/accounts/userPairs/pairs — `userId` from gateway JWT headers. */
export function listUserPairs() {
  return request.post<UserPairsRsp>(PerpsAccountsApi.userPairs);
}

/** POST /perps/accounts/userPairs/add — `userId` from gateway JWT headers. */
export function addUserPair(req: UserPairAddReq) {
  return request.post<UserPairsRsp>(PerpsAccountsApi.userPairsAdd, {
    pairId: req.pairId,
  });
}

/** POST /perps/accounts/userPairs/delete — `userId` from gateway JWT headers. */
export function deleteUserPair(req: UserPairDeleteReq) {
  return request.post<UserPairsRsp>(PerpsAccountsApi.userPairsDelete, {
    pairId: req.pairId,
  });
}

/** POST /perps/accounts/userPairs/reorder — `userId` from gateway JWT headers. */
export function reorderUserPairs(req: UserPairsReorderReq) {
  return request.post<void>(PerpsAccountsApi.userPairsReorder, {
    pairIds: req.pairIds,
  });
}
