import { allocateOrderSalt } from "@/lib/orders/order-salt";
import { request } from "@/lib/api/request";
import { resolveSpotBalanceTokenAddress } from "@/lib/tokens/spot-balance-token";
import { SpotOrdersApi } from "@/services/spot/orders/paths";
import type { GetPairByCodeReq, OrderSaltRsp, PairRsp, WithdrawApplyReq } from "@/services/spot/orders/types";

/** GET /orders/pairs/{baseToken}/{quoteToken} */
export function getPairByCode(req: GetPairByCodeReq) {
  const baseToken = req.baseToken.toUpperCase();
  const quoteToken = req.quoteToken.toUpperCase();
  return request.get<PairRsp>(SpotOrdersApi.pairByTokens(baseToken, quoteToken));
}

/** POST /orders/orders/salt — cached client-side when sequence slot allows. */
export function getOrderSalt(): Promise<OrderSaltRsp> {
  return allocateOrderSalt();
}

/** POST /orders/withdrawals/apply — `userId` from gateway JWT headers. */
export function applyWithdraw(req: WithdrawApplyReq) {
  const tokenAddress = resolveSpotBalanceTokenAddress(req.tokenAddress);
  if (!tokenAddress) {
    return Promise.reject(new Error("Missing token address for withdrawal"));
  }

  return request.post<void>(SpotOrdersApi.withdrawalsApply, {
    userBalancesId: req.userBalancesId,
    fromAddress: req.fromAddress.toLowerCase(),
    tokenAddress: tokenAddress.toLowerCase(),
    amount: req.amount,
    salt: req.salt,
    signature: req.signature,
  });
}
