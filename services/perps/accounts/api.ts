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
