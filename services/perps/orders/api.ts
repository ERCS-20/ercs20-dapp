import { allocatePerpsOrderSalt } from "@/lib/perps/order-salt";
import { request } from "@/lib/api/request";
import { getPerpsNativeTokenAddress } from "@/lib/config/perps-native-token";
import { apiBigIntToString } from "@/lib/utils/coerce-bigint";
import { PerpsOrdersApi } from "@/services/perps/orders/paths";
import type {
  CancelOrderReq,
  GetPairByCodeReq,
  OrdersHistoryPaginationReq,
  OrdersHistoryPaginationRsp,
  OrdersListRsp,
  PerpsPositionEventsListReq,
  OrdersTradeHistoryListReq,
  OrdersTradeHistoryListRsp,
  OrdersTradeHistoryPaginationReq,
  OrdersTradeHistoryPaginationRsp,
  PairRsp,
  PerpsOrderSaltRsp,
  PerpsOrdersUserBalanceReq,
  PerpsOrdersUserBalanceRsp,
  PerpsWithdrawApplyReq,
  PlaceOrderReq,
  PositionCashLedgerListReq,
  PositionCashLedgerListRsp,
  PositionHistoryPaginationReq,
  PositionHistoryPaginationRsp,
  PositionMarginEventsListReq,
  PositionMarginEventsListRsp,
  FundingSettlementsListReq,
  FundingSettlementsListRsp,
  PositionsListRsp,
  UserPairAddReq,
  UserPairDeleteReq,
  UserPairsReorderReq,
  UserPairsRsp,
} from "@/services/perps/orders/types";

/** GET /perps/orders/pairs/{baseToken}/{quoteToken} */
export function getPairByCode(req: GetPairByCodeReq) {
  const baseToken = req.baseToken.toUpperCase();
  const quoteToken = req.quoteToken.toUpperCase();
  return request.get<PairRsp>(PerpsOrdersApi.pairByTokens(baseToken, quoteToken));
}

/** POST /perps/orders/orders/salt — cached client-side when sequence slot allows. */
export function getPerpsOrderSalt(): Promise<PerpsOrderSaltRsp> {
  return allocatePerpsOrderSalt();
}

export function getOrderSalt(): Promise<PerpsOrderSaltRsp> {
  return getPerpsOrderSalt();
}

/** POST /perps/orders/orders/place — `userId` from gateway JWT headers. */
export function placeOrder(req: PlaceOrderReq) {
  return request.post<void>(PerpsOrdersApi.ordersPlace, {
    userBalanceId: req.userBalanceId,
    pairId: req.pairId,
    maker: req.maker.toLowerCase(),
    amount: apiBigIntToString(req.amount),
    margin: apiBigIntToString(req.margin),
    timeInForce: req.timeInForce,
    expiry: apiBigIntToString(req.expiry),
    salt: apiBigIntToString(req.salt),
    signature: req.signature,
    priceX18: apiBigIntToString(req.priceX18),
    side: req.side,
  });
}

/** POST /perps/orders/orders/cancel — `userId` from gateway JWT headers. */
export function cancelOrder(req: CancelOrderReq) {
  return request.post<void>(PerpsOrdersApi.ordersCancel, {
    userBalanceId: req.userBalanceId,
    orderId: apiBigIntToString(req.orderId),
    salt: apiBigIntToString(req.salt),
    signature: req.signature,
  });
}

/** POST /perps/orders/orders/list — `userId` from gateway JWT headers; no body. */
export function listOrders() {
  return request.post<OrdersListRsp>(PerpsOrdersApi.ordersList);
}

/** POST /perps/orders/positions/list — `userId` from gateway JWT headers; no body. */
export function listPositions() {
  return request.post<PositionsListRsp>(PerpsOrdersApi.positionsList);
}

/** POST /perps/orders/positions-history/pagination */
export function paginationPositionHistory(req: PositionHistoryPaginationReq) {
  return request.post<PositionHistoryPaginationRsp>(
    PerpsOrdersApi.positionHistoryPagination,
    req
  );
}

/** POST /perps/orders/orders-history/pagination */
export function paginationOrdersHistory(req: OrdersHistoryPaginationReq) {
  return request.post<OrdersHistoryPaginationRsp>(PerpsOrdersApi.ordersHistoryPagination, req);
}

/** POST /perps/orders/orders-trade-history/pagination */
export function paginationOrdersTradeHistory(req: OrdersTradeHistoryPaginationReq) {
  return request.post<OrdersTradeHistoryPaginationRsp>(
    PerpsOrdersApi.ordersTradeHistoryPagination,
    req
  );
}

function timeRangeListBody(req: PerpsPositionEventsListReq) {
  return {
    pairId: req.pairId,
    account: req.account.toLowerCase(),
    fromBlockTimestamp: req.fromBlockTimestamp,
    toBlockTimestamp: req.toBlockTimestamp,
  };
}

/** POST /perps/orders/orders-trade-history/list */
export function listOrdersTradeHistory(req: OrdersTradeHistoryListReq) {
  return request.post<OrdersTradeHistoryListRsp>(
    PerpsOrdersApi.ordersTradeHistoryList,
    timeRangeListBody(req)
  );
}

/** POST /perps/orders/position-cash-ledger/list */
export function listPositionCashLedger(req: PositionCashLedgerListReq) {
  return request.post<PositionCashLedgerListRsp>(PerpsOrdersApi.positionCashLedgerList, {
    positionId: req.positionId,
  });
}

/** POST /perps/orders/position-margin-events/list */
export function listPositionMarginEvents(req: PositionMarginEventsListReq) {
  return request.post<PositionMarginEventsListRsp>(
    PerpsOrdersApi.positionMarginEventsList,
    timeRangeListBody(req)
  );
}

/** POST /perps/orders/funding-settlements/list */
export function listFundingSettlements(req: FundingSettlementsListReq) {
  return request.post<FundingSettlementsListRsp>(
    PerpsOrdersApi.fundingSettlementsList,
    timeRangeListBody(req)
  );
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

export function getOrdersUserBalance(req: PerpsOrdersUserBalanceReq) {
  return getPerpsOrdersUserBalance(req);
}

/** POST /perps/orders/userPairs/pairs — `userId` from gateway JWT headers. */
export function listUserPairs() {
  return request.post<UserPairsRsp>(PerpsOrdersApi.userPairs);
}

/** POST /perps/orders/userPairs/add — `userId` from gateway JWT headers. */
export function addUserPair(req: UserPairAddReq) {
  return request.post<UserPairsRsp>(PerpsOrdersApi.userPairsAdd, {
    pairId: req.pairId,
  });
}

/** POST /perps/orders/userPairs/delete — `userId` from gateway JWT headers. */
export function deleteUserPair(req: UserPairDeleteReq) {
  return request.post<UserPairsRsp>(PerpsOrdersApi.userPairsDelete, {
    pairId: req.pairId,
  });
}

/** POST /perps/orders/userPairs/reorder — `userId` from gateway JWT headers. */
export function reorderUserPairs(req: UserPairsReorderReq) {
  return request.post<void>(PerpsOrdersApi.userPairsReorder, {
    pairIds: req.pairIds,
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
