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
  /** Base size (18 decimals). */
  amount: ApiBigInt;
  /** Isolated margin to lock (quote decimals). */
  margin: ApiBigInt;
  timeInForce: number;
  /** Unix epoch seconds. */
  expiry: ApiBigInt;
  /** = EIP-712 `Order.nonce`. */
  salt: ApiBigInt;
  signature: string;
  /** Limit price × 1e18 (quote/base). */
  priceX18: ApiBigInt;
  /** 1 = buy, 2 = sell. */
  side: number;
};

/** Mirrors `exchange.orbix.perps.orders.dto.CancelOrderReq`. */
export type CancelOrderReq = {
  userBalanceId: number;
  orderId: ApiBigInt;
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

/** Mirrors `exchange.orbix.perps.orders.dto.OrdersRsp`. Dates = Unix ms. */
export type OrdersRsp = {
  id: ApiBigInt;
  pairId: number;
  pairCode: string;
  amount: ApiBigInt;
  margin: ApiBigInt;
  timeInForce: number;
  /** Unix epoch milliseconds. */
  expiry: number;
  salt: ApiBigInt;
  priceX18: ApiBigInt;
  enginePrice: ApiBigInt;
  enginePriceDecimal: number;
  side: number;
  filledAmount: ApiBigInt;
  lockedMargin: ApiBigInt;
  fee: ApiBigInt;
  status: string;
  /** Unix epoch milliseconds. */
  placedAt: number;
};

export type OrdersListRsp = OrdersRsp[];

/** Mirrors `exchange.orbix.perps.orders.dto.PositionsRsp`. */
export type PositionsRsp = {
  id: number;
  pairId: number;
  pairCode: string;
  /** 1 = buy/long, 2 = sell/short. */
  side: number;
  margin: ApiBigInt;
  position: ApiBigInt;
  avgEntryX18: ApiBigInt;
  liqPrice: ApiBigInt;
  fundingTimestamp?: number;
  fundingValue?: ApiBigInt;
  /** Unix epoch milliseconds. */
  updatedAt: number;
};

export type PositionsListRsp = PositionsRsp[];

export type OrdersHistoryRsp = OrdersRsp & {
  /** Unix epoch milliseconds. */
  completedAt: number;
};

export type OrdersHistoryPaginationReq = PaginationCondition<Record<string, never>>;
export type OrdersHistoryPaginationRsp = PaginationRepertory<OrdersHistoryRsp>;

/** Mirrors `exchange.orbix.perps.orders.dto.OrdersTradeHistoryRsp`. */
export type OrdersTradeHistoryRsp = {
  pairId: number;
  pairCode: string;
  orderId: ApiBigInt;
  enginePrice: ApiBigInt;
  enginePriceDecimal: number;
  /** Base size (18 decimals) — not spot's `quantity`. */
  amount: ApiBigInt;
  margin: ApiBigInt;
  fee: ApiBigInt;
  realizedPnl: ApiBigInt;
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
