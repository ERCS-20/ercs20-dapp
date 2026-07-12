import { allocateOrderSalt } from "@/lib/orders/order-salt";
import { request } from "@/lib/api/request";
import { apiBigIntToString } from "@/lib/utils/coerce-bigint";
import { resolveSpotBalanceTokenAddress } from "@/lib/tokens/spot-balance-token";
import { SpotOrdersApi } from "@/services/spot/orders/paths";
import type {
  GetPairByCodeReq,
  OrderSaltRsp,
  OrdersHistoryPaginationReq,
  OrdersHistoryPaginationRsp,
  OrdersPaginationReq,
  OrdersPaginationRsp,
  OrdersTradeHistoryPaginationReq,
  OrdersTradeHistoryPaginationRsp,
  OrdersUserBalanceReq,
  OrdersUserBalanceRsp,
  OrdersUserBalancesPairReq,
  OrdersUserBalancesPairRsp,
  PairRsp,
  PlaceOrderReq,
  WithdrawApplyReq,
} from "@/services/spot/orders/types";

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

/** POST /orders/orders/place — `userId` from gateway JWT headers. */
export function placeOrder(req: PlaceOrderReq) {
  return request.post<void>(SpotOrdersApi.ordersPlace, {
    pairId: req.pairId,
    maker: req.maker.toLowerCase(),
    makerToken: req.makerToken.toLowerCase(),
    takerToken: req.takerToken.toLowerCase(),
    makerAmount: apiBigIntToString(req.makerAmount),
    takerAmount: apiBigIntToString(req.takerAmount),
    timeInForce: req.timeInForce,
    expiry: apiBigIntToString(req.expiry),
    salt: apiBigIntToString(req.salt),
    signature: req.signature,
  });
}

/** POST /orders/orders/pagination — `userId` from gateway JWT headers. */
export function paginationOrders(req: OrdersPaginationReq) {
  return request.post<OrdersPaginationRsp>(SpotOrdersApi.ordersPagination, req);
}

/** POST /orders/orders-history/pagination — `userId` from gateway JWT headers. */
export function paginationOrdersHistory(req: OrdersHistoryPaginationReq) {
  return request.post<OrdersHistoryPaginationRsp>(SpotOrdersApi.ordersHistoryPagination, req);
}

/** POST /orders/orders-trade-history/pagination — `userId` from gateway JWT headers. */
export function paginationOrdersTradeHistory(req: OrdersTradeHistoryPaginationReq) {
  return request.post<OrdersTradeHistoryPaginationRsp>(
    SpotOrdersApi.ordersTradeHistoryPagination,
    req
  );
}

/** POST /orders/user-balances/balance — `userId` from gateway JWT headers. */
export function getOrdersUserBalance(req: OrdersUserBalanceReq) {
  const tokenAddress = resolveSpotBalanceTokenAddress(req.tokenAddress);
  if (!tokenAddress) {
    return Promise.reject(new Error("Missing token address for balance query"));
  }

  return request.post<OrdersUserBalanceRsp>(SpotOrdersApi.userBalance, {
    tokenAddress: tokenAddress.toLowerCase(),
  });
}

/** POST /orders/user-balances/balances-pair — `userId` from gateway JWT headers. */
export function getPairBalances(req: OrdersUserBalancesPairReq) {
  return request.post<OrdersUserBalancesPairRsp>(SpotOrdersApi.userBalancesPair, {
    baseTokenAddress: req.baseTokenAddress.toLowerCase(),
    quoteTokenAddress: req.quoteTokenAddress.toLowerCase(),
  });
}

/** POST /orders/withdrawals/apply — `userId` from gateway JWT headers. */
export function applyWithdraw(req: WithdrawApplyReq) {
  const tokenAddress = resolveSpotBalanceTokenAddress(req.tokenAddress);
  if (!tokenAddress) {
    return Promise.reject(new Error("Missing token address for withdrawal"));
  }

  return request.post<void>(SpotOrdersApi.withdrawalsApply, {
    fromAddress: req.fromAddress.toLowerCase(),
    tokenAddress: tokenAddress.toLowerCase(),
    amount: req.amount,
    salt: req.salt,
    signature: req.signature,
  });
}
