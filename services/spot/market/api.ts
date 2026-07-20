import { request } from "@/lib/api/request";
import { SpotMarketApi } from "@/services/spot/market/paths";
import type {
  KlineCurrentDayReq,
  KlineListReq,
  KlineListRsp,
  MarketKlineCurrentDayRsp,
  MarketOrderBookListRsp,
  MarketPairsPaginationReq,
  MarketPairsPaginationRsp,
  MarketPairsRsp,
  MarketPairsUserReq,
  MarketTradeListRsp,
} from "@/services/spot/market/types";

/** POST /market/store/pairs/pagination */
export function paginationMarketPairs(req: MarketPairsPaginationReq) {
  return request.post<MarketPairsPaginationRsp>(SpotMarketApi.pairsPagination, req);
}

/** POST /market/store/pairs/user-pairs */
export function listMarketUserPairs(req: MarketPairsUserReq) {
  return request.post<MarketPairsRsp>(SpotMarketApi.pairsUserPairs, {
    pairIds: req.pairIds,
  });
}

/** POST /market/store/kline/current-day */
export function getKlineCurrentDay(req: KlineCurrentDayReq) {
  return request.post<MarketKlineCurrentDayRsp>(SpotMarketApi.klineCurrentDay, {
    pairId: req.pairId,
  });
}

/** POST /market/store/kline/list */
export function listKlines(req: KlineListReq) {
  return request.post<KlineListRsp>(SpotMarketApi.klineList, {
    pairId: req.pairId,
    interval: req.interval,
    ...(req.limit != null ? { limit: req.limit } : {}),
    ...(req.beforeOpenTime != null ? { beforeOpenTime: req.beforeOpenTime } : {}),
  });
}

/** GET /market/store/trades/{pairId} */
export function listMarketTrades(pairId: number) {
  return request.get<MarketTradeListRsp>(SpotMarketApi.trades(pairId));
}

/** GET /market/store/order-book/{pairId} */
export function getMarketOrderBook(pairId: number) {
  return request.get<MarketOrderBookListRsp>(SpotMarketApi.orderBook(pairId));
}
