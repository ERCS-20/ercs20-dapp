import type { ApiBigInt } from "@/lib/utils/coerce-bigint";

/** Mirrors `exchange.orbix.perps.orders.dto.OrderSaltRsp`. */
export type PerpsOrderSaltRsp = {
  salt: string;
};

/** Mirrors `exchange.orbix.perps.orders.dto.UserBalancesReq`. */
export type PerpsOrdersUserBalanceReq = {
  tokenAddress: string;
};

/** Mirrors `exchange.orbix.perps.orders.dto.UserBalancesRsp`. */
export type PerpsOrdersUserBalanceRsp = {
  userBalanceId: number | null;
  balance: ApiBigInt;
};

/** Mirrors `exchange.orbix.perps.orders.dto.WithdrawReq`. */
export type PerpsWithdrawApplyReq = {
  userBalanceId: number;
  fromAddress: string;
  tokenAddress: string;
  amount: string;
  salt: string;
  signature: string;
};
