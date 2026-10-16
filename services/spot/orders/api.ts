import { getAuthSession } from "@/lib/auth/session";
import { request } from "@/lib/api/request";
import {
  loadSpotOrderSaltStorage,
  saveSpotOrderSaltStorage,
} from "@/lib/storage/local-storage";
import { allocateCachedSalt } from "@/lib/utils/allocate-cached-salt";
import { apiBigIntToString, parseApiBigInt } from "@/lib/utils/coerce-bigint";
import { resolveSpotUserBalancesId } from "@/services/spot/accounts/api";
import { resolveSpotBalanceTokenAddress } from "@/lib/tokens/spot-balance-token";
import { SpotOrdersApi } from "@/services/spot/orders/paths";
import type {
  CancelOrderReq,
  GetPairByCodeReq,
  OrderSaltRsp,
  OrdersHistoryPaginationReq,
  OrdersHistoryPaginationRsp,
  OrdersListRsp,
  OrdersTradeHistoryPaginationReq,
  OrdersTradeHistoryPaginationRsp,
  OrdersUserBalanceReq,
  OrdersUserBalanceRsp,
  OrdersUserBalancesPairReq,
  OrdersUserBalancesPairRsp,
  PairRsp,
  PlaceOrderReq,
  UserPairAddReq,
  UserPairDeleteReq,
  UserPairsReorderReq,
  UserPairsRsp,
  WithdrawApplyReq,
} from "@/services/spot/orders/types";

/** GET /orders/pairs/{baseToken}/{quoteToken} */
export function getPairByCode(req: GetPairByCodeReq) {
  const baseToken = req.baseToken.toUpperCase();
  const quoteToken = req.quoteToken.toUpperCase();
  return request.get<PairRsp>(SpotOrdersApi.pairByTokens(baseToken, quoteToken));
}

async function fetchRemoteSpotOrderSalt(): Promise<bigint> {
  const data = await request.post<{ salt: bigint | number | string }>(SpotOrdersApi.orderSalt);
  const salt = parseApiBigInt(data.salt);
  if (salt == null) {
    throw new Error("Invalid order salt from API");
  }
  return salt;
}

function readCachedSpotOrderSalt(): bigint | null {
  const raw = loadSpotOrderSaltStorage(getAuthSession()?.userId);
  if (!raw) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

let spotOrderSaltChain: Promise<OrderSaltRsp> | null = null;

/** POST /orders/orders/salt — cached client-side when sequence slot allows. */
export function getOrderSalt(): Promise<OrderSaltRsp> {
  if (typeof window === "undefined") {
    return fetchRemoteSpotOrderSalt().then((salt) => ({ salt: salt.toString() }));
  }

  spotOrderSaltChain ??= allocateCachedSalt({
    readCached: readCachedSpotOrderSalt,
    writeCached: (salt) => {
      saveSpotOrderSaltStorage(getAuthSession()?.userId, salt.toString());
    },
    fetchRemote: fetchRemoteSpotOrderSalt,
  }).finally(() => {
    spotOrderSaltChain = null;
  });
  return spotOrderSaltChain;
}

/** POST /orders/orders/place — `userId` from gateway JWT headers. */
export function placeOrder(req: PlaceOrderReq) {
  return request.post<void>(SpotOrdersApi.ordersPlace, {
    userBalanceId: req.userBalanceId,
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

/** POST /orders/orders/cancel — `userId` from gateway JWT headers. */
export function cancelOrder(req: CancelOrderReq) {
  return request.post<void>(SpotOrdersApi.ordersCancel, {
    userBalanceId: req.userBalanceId,
    orderId: apiBigIntToString(req.orderId),
    tokenAddress: req.tokenAddress.toLowerCase(),
    salt: apiBigIntToString(req.salt),
    signature: req.signature,
  });
}

/** POST /spot/orders/orders/list — `userId` from gateway JWT headers; no body. */
export function listOrders() {
  return request.post<OrdersListRsp>(SpotOrdersApi.ordersList);
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
export async function getOrdersUserBalance(req: {
  tokenAddress: string;
  userBalancesId?: number;
}) {
  const tokenAddress = resolveSpotBalanceTokenAddress(req.tokenAddress)?.toLowerCase();
  if (!tokenAddress) {
    return Promise.reject(new Error("Missing token address for balance query"));
  }
  const userBalancesId =
    req.userBalancesId != null && req.userBalancesId > 0
      ? req.userBalancesId
      : await resolveSpotUserBalancesId(tokenAddress);

  const body: OrdersUserBalanceReq = { userBalancesId, tokenAddress };
  return request.post<OrdersUserBalanceRsp>(SpotOrdersApi.userBalance, body);
}

/** POST /orders/user-balances/balances-pair — `userId` from gateway JWT headers. */
export async function getPairBalances(req: {
  baseTokenAddress: string;
  quoteTokenAddress: string;
  baseUserBalancesId?: number;
  quoteUserBalancesId?: number;
}) {
  const baseTokenAddress = req.baseTokenAddress.toLowerCase();
  const quoteTokenAddress = req.quoteTokenAddress.toLowerCase();
  const [baseUserBalancesId, quoteUserBalancesId] = await Promise.all([
    req.baseUserBalancesId != null && req.baseUserBalancesId > 0
      ? req.baseUserBalancesId
      : resolveSpotUserBalancesId(baseTokenAddress),
    req.quoteUserBalancesId != null && req.quoteUserBalancesId > 0
      ? req.quoteUserBalancesId
      : resolveSpotUserBalancesId(quoteTokenAddress),
  ]);

  const body: OrdersUserBalancesPairReq = {
    baseUserBalancesId,
    baseTokenAddress,
    quoteUserBalancesId,
    quoteTokenAddress,
  };
  return request.post<OrdersUserBalancesPairRsp>(SpotOrdersApi.userBalancesPair, body);
}

/** POST /orders/userPairs/pairs — `userId` from gateway JWT headers. */
export function listUserPairs() {
  return request.post<UserPairsRsp>(SpotOrdersApi.userPairs);
}

/** POST /orders/userPairs/add — `userId` from gateway JWT headers. */
export function addUserPair(req: UserPairAddReq) {
  return request.post<UserPairsRsp>(SpotOrdersApi.userPairsAdd, {
    pairId: req.pairId,
  });
}

/** POST /orders/userPairs/delete — `userId` from gateway JWT headers. */
export function deleteUserPair(req: UserPairDeleteReq) {
  return request.post<UserPairsRsp>(SpotOrdersApi.userPairsDelete, {
    pairId: req.pairId,
  });
}

/** POST /orders/userPairs/reorder — `userId` from gateway JWT headers. */
export function reorderUserPairs(req: UserPairsReorderReq) {
  return request.post<void>(SpotOrdersApi.userPairsReorder, {
    pairIds: req.pairIds,
  });
}

/** POST /orders/withdrawals/apply — `userId` from gateway JWT headers. */
export function applyWithdraw(req: WithdrawApplyReq) {
  const tokenAddress = resolveSpotBalanceTokenAddress(req.tokenAddress);
  if (!tokenAddress) {
    return Promise.reject(new Error("Missing token address for withdrawal"));
  }

  return request.post<void>(SpotOrdersApi.withdrawalsApply, {
    userBalanceId: req.userBalanceId,
    fromAddress: req.fromAddress.toLowerCase(),
    tokenAddress: tokenAddress.toLowerCase(),
    amount: req.amount,
    salt: req.salt,
    signature: req.signature,
  });
}
