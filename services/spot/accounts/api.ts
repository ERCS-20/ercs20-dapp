import { request } from "@/lib/api/request";
import { resolveSpotBalanceTokenAddress } from "@/lib/tokens/spot-balance-token";
import { SpotAccountsApi } from "@/services/spot/accounts/paths";
import type {
  DepositsPaginationReq,
  DepositsPaginationRsp,
  UserBalancesReq,
  UserBalancesRsp,
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
