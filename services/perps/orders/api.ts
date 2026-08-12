import { allocatePerpsOrderSalt } from "@/lib/orders/perps-order-salt";
import { request } from "@/lib/api/request";
import { getPerpsNativeTokenAddress } from "@/lib/config/perps-native-token";
import { PerpsOrdersApi } from "@/services/perps/orders/paths";
import type {
  PerpsOrderSaltRsp,
  PerpsOrdersUserBalanceReq,
  PerpsOrdersUserBalanceRsp,
  PerpsWithdrawApplyReq,
} from "@/services/perps/orders/types";

/** POST /perps/orders/orders/salt — cached client-side when sequence slot allows. */
export function getPerpsOrderSalt(): Promise<PerpsOrderSaltRsp> {
  return allocatePerpsOrderSalt();
}

/**
 * POST /perps/orders/user-balances/balance — `userId` from gateway JWT headers.
 * Defaults to configured native USDC ledger token (`0xeee…`).
 */
export function getPerpsOrdersUserBalance(req?: Partial<PerpsOrdersUserBalanceReq>) {
  const tokenAddress = (
    req?.tokenAddress?.trim() || getPerpsNativeTokenAddress()
  ).toLowerCase();
  return request.post<PerpsOrdersUserBalanceRsp>(PerpsOrdersApi.userBalance, {
    tokenAddress,
  });
}

/** POST /perps/orders/withdrawals/apply — `userId` from gateway JWT headers. */
export function applyPerpsWithdraw(req: PerpsWithdrawApplyReq) {
  const tokenAddress = (
    req.tokenAddress?.trim() || getPerpsNativeTokenAddress()
  ).toLowerCase();

  return request.post<void>(PerpsOrdersApi.withdrawalsApply, {
    userBalanceId: req.userBalanceId,
    fromAddress: req.fromAddress.toLowerCase(),
    tokenAddress,
    amount: req.amount,
    salt: req.salt,
    signature: req.signature,
  });
}
