import type { PaginationCondition, PaginationRepertory } from "@/lib/api/pagination";
import type { ApiBigInt } from "@/lib/utils/coerce-bigint";

/** Mirrors `exchange.orbix.perps.orders.dto.OrderSaltRsp`. */
export type PerpsOrderSaltRsp = {
  salt: string;
};

/** Copied trading terminal types (spot → perps path). */
export type OrderSaltRsp = PerpsOrderSaltRsp;

/** Query pair by base + quote token (pairCode = `{baseToken}_{quoteToken}`). */
export type GetPairByCodeReq = {
  baseToken: string;
  quoteToken: string;
};

/** Mirrors `exchange.orbix.perps.orders.api.dto.PairRsp`. */
export type PairRsp = {
  id: number;
  pairCode: string;
  blockNumber: string;
  logIndex: number;
  txHash: string;
  baseTokenAddress: string;
  quoteTokenAddress: string;
  minTradeAmount: ApiBigInt;
  maxPriceFluctuation: number;
  issuePrice: string;
  enginePriceDecimal: number;
  /** Unix epoch milliseconds. */
  expiresAt: number;
};

/** Mirrors `exchange.orbix.perps.orders.dto.PlaceOrderReq`. */
export type PlaceOrderReq = {
  userBalanceId: number;
  pairId: number;
  maker: string;
  makerToken: string;
  takerToken: string;
  makerAmount: ApiBigInt;
  takerAmount: ApiBigInt;
  timeInForce: number;
  expiry: ApiBigInt;
  salt: ApiBigInt;
  signature: string;
};

/** Mirrors `exchange.orbix.perps.orders.dto.CancelOrderReq`. */
export type CancelOrderReq = {
  userBalanceId: number;
  orderId: ApiBigInt;
  tokenAddress: string;
  salt: ApiBigInt;
  signature: string;
};

/** Mirrors `exchange.orbix.perps.orders.dto.UserBalancesReq`. */
export type PerpsOrdersUserBalanceReq = {
  tokenAddress: string;
};

export type OrdersUserBalanceReq = PerpsOrdersUserBalanceReq;

/** Mirrors `exchange.orbix.perps.orders.dto.UserBalancesRsp`. */
export type PerpsOrdersUserBalanceRsp = {
  userBalanceId: number | null;
  balance: ApiBigInt;
};

export type OrdersUserBalanceRsp = PerpsOrdersUserBalanceRsp;

/** Mirrors `exchange.orbix.perps.orders.dto.WithdrawReq`. */
export type PerpsWithdrawApplyReq = {
  userBalanceId: number;
  fromAddress: string;
  tokenAddress: string;
  amount: string;
  salt: string;
  signature: string;
};

export type WithdrawApplyReq = PerpsWithdrawApplyReq;

/** Mirrors `exchange.orbix.perps.orders.dto.OrdersRsp`. */
export type OrdersRsp = {
  id: number;
  pairId: number;
  pairCode: string;
  makerAmount: ApiBigInt;
  takerAmount: ApiBigInt;
  timeInForce: number;
  /** Unix epoch milliseconds. */
  expiry: number;
  salt: ApiBigInt;
  enginePrice: ApiBigInt;
  enginePriceDecimal: number;
  quantity: ApiBigInt;
  side: number;
  filledMakerAmount: ApiBigInt;
  filledTakerAmount: ApiBigInt;
  fee: ApiBigInt;
  status: string;
  /** Unix epoch milliseconds. */
  placedAt: number;
};

export type OrdersPaginationReq = PaginationCondition<Record<string, never>>;
export type OrdersPaginationRsp = PaginationRepertory<OrdersRsp>;

export type OrdersHistoryRsp = OrdersRsp & {
  /** Unix epoch milliseconds. */
  completedAt: number;
};

export type OrdersHistoryPaginationReq = PaginationCondition<Record<string, never>>;
export type OrdersHistoryPaginationRsp = PaginationRepertory<OrdersHistoryRsp>;

export type OrdersTradeHistoryRsp = {
  pairId: number;
  pairCode: string;
  orderId: ApiBigInt;
  enginePrice: ApiBigInt;
  enginePriceDecimal: number;
  quantity: ApiBigInt;
  amount: ApiBigInt;
  fee: ApiBigInt;
  placeSide: number;
  matchedSide: number;
  /** Unix epoch milliseconds. */
  tradeTime: number;
  tradeStatus: string;
  txHash: string;
};

export type OrdersTradeHistoryPaginationReq = PaginationCondition<Record<string, never>>;
export type OrdersTradeHistoryPaginationRsp = PaginationRepertory<OrdersTradeHistoryRsp>;

/** Mirrors `exchange.orbix.perps.orders.dto.UserPairRsp`. */
export type UserPairRsp = {
  id: number;
  pairId: number;
  sortOrder: number;
};

/** Mirrors `exchange.orbix.perps.orders.dto.UserPairsRsp`. */
export type UserPairsRsp = {
  pairs: UserPairRsp[];
};

/** Mirrors `exchange.orbix.perps.orders.dto.UserPairAddReq`. */
export type UserPairAddReq = {
  pairId: number;
};

/** Mirrors `exchange.orbix.perps.orders.dto.UserPairDeleteReq`. */
export type UserPairDeleteReq = {
  pairId: number;
};

/** Mirrors `exchange.orbix.perps.orders.dto.UserPairsReorderReq`. */
export type UserPairsReorderReq = {
  pairIds: number[];
};
