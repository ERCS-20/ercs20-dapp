import { request } from "@/lib/api/request";
import { SpotAccountsApi } from "@/services/spot/accounts/paths";
import type { UserBalancesReq, UserBalancesRsp } from "@/services/spot/accounts/types";

/** POST /users/user-balances/balance — `userId` from gateway JWT headers. */
export function getUserBalance(req: UserBalancesReq) {
  return request.post<UserBalancesRsp>(SpotAccountsApi.userBalance, {
    tokenAddress: req.tokenAddress.toLowerCase(),
  });
}
