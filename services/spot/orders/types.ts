import type { PaginationCondition, PaginationRepertory } from "@/lib/api/pagination";
import type { ApiBigInt } from "@/lib/utils/coerce-bigint";

/** Query pair by base + quote token (pairCode = `{baseToken}_{quoteToken}`). */
export type GetPairByCodeReq = {
  baseToken: string;
  quoteToken: string;
};

/** Mirrors `exchange.orbix.spot.orders.api.dto.PairRsp`. BigInteger → string in JSON. */
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
  expiresAt: string;
};

/** Mirrors `exchange.orbix.spot.orders.dto.OrderSaltRsp`. */
export type OrderSaltRsp = {
  /** Order / withdraw anti-replay salt (uint64 as string). */
  salt: string;
};

/** Mirrors `exchange.orbix.spot.orders.dto.PlaceOrderReq`. BigInteger → string in JSON. */
export type PlaceOrderReq = {
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

/** Mirrors `exchange.orbix.spot.orders.dto.WithdrawReq`. BigInteger → string in JSON. */
export type WithdrawApplyReq = {
  fromAddress: string;
  tokenAddress: string;
  amount: string;
  salt: string;
  signature: string;
};

/** Mirrors `exchange.orbix.spot.orders.dto.OrdersRsp`. BigInteger → string in JSON. */
export type OrdersRsp = {
  id: number;
  pairId: number;
  pairCode: string;
  makerAmount: ApiBigInt;
  takerAmount: ApiBigInt;
  timeInForce: number;
  expiry: string;
  salt: ApiBigInt;
  enginePrice: ApiBigInt;
  enginePriceDecimal: number;
  quantity: ApiBigInt;
  side: number;
  filledMakerAmount: ApiBigInt;
  filledTakerAmount: ApiBigInt;
  fee: ApiBigInt;
  status: string;
  placedAt: string;
};

/** Mirrors `PaginationCondition<Void>` for open orders pagination. */
export type OrdersPaginationReq = PaginationCondition<Record<string, never>>;
export type OrdersPaginationRsp = PaginationRepertory<OrdersRsp>;

/** Mirrors `exchange.orbix.spot.orders.dto.OrdersHistoryRsp`. BigInteger → string in JSON. */
export type OrdersHistoryRsp = OrdersRsp & {
  completedAt: string;
};

/** Mirrors `PaginationCondition<Void>` for order history pagination. */
export type OrdersHistoryPaginationReq = PaginationCondition<Record<string, never>>;
export type OrdersHistoryPaginationRsp = PaginationRepertory<OrdersHistoryRsp>;

/** Mirrors `exchange.orbix.spot.orders.dto.OrdersTradeHistoryRsp`. BigInteger → string in JSON. */
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
  tradeTime: string;
  tradeStatus: string;
  txHash: string;
};

/** Mirrors `PaginationCondition<Void>` for trade history pagination. */
export type OrdersTradeHistoryPaginationReq = PaginationCondition<Record<string, never>>;
export type OrdersTradeHistoryPaginationRsp = PaginationRepertory<OrdersTradeHistoryRsp>;

/** Mirrors `exchange.orbix.spot.orders.dto.UserBalancesReq`. */
export type OrdersUserBalanceReq = {
  tokenAddress: string;
};

/** Mirrors `exchange.orbix.spot.orders.dto.UserBalancesRsp`. BigInteger → string in JSON. */
export type OrdersUserBalanceRsp = {
  balance: ApiBigInt;
};

/** Mirrors `exchange.orbix.spot.orders.dto.UserBalancesPairReq`. */
export type OrdersUserBalancesPairReq = {
  baseTokenAddress: string;
  quoteTokenAddress: string;
};

/** Mirrors `exchange.orbix.spot.orders.dto.UserBalancesPairRsp`. BigInteger → string in JSON. */
export type OrdersUserBalancesPairRsp = {
  baseBalance: ApiBigInt;
  quoteBalance: ApiBigInt;
};
