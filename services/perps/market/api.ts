import { request } from "@/lib/api/request";
import { PerpsMarketApi } from "@/services/perps/market/paths";
import type {
  KlineCurrentDayReq,
  KlineListReq,
  KlineListRsp,
  MarketKlineCurrentDayRsp,
  MarketBidsAndAsksRsp,
  MarketPairsPaginationReq,
  MarketPairsPaginationRsp,
  MarketPairsRsp,
  MarketPairsUserReq,
  MarketTradeListRsp,
} from "@/services/perps/market/types";

/** POST /market/store/pairs/pagination */
export function paginationMarketPairs(req: MarketPairsPaginationReq) {
  return request.post<MarketPairsPaginationRsp>(PerpsMarketApi.pairsPagination, req);
}

/** POST /market/store/pairs/user-pairs */
export function listMarketUserPairs(req: MarketPairsUserReq) {
  return request.post<MarketPairsRsp>(PerpsMarketApi.pairsUserPairs, {
    pairIds: req.pairIds,
  });
}

/** POST /market/store/kline/current-day */
export function getKlineCurrentDay(req: KlineCurrentDayReq) {
  return request.post<MarketKlineCurrentDayRsp>(PerpsMarketApi.klineCurrentDay, {
    pairId: req.pairId,
  });
}

/** POST /market/store/kline/list */
export function listKlines(req: KlineListReq) {
  return request.post<KlineListRsp>(PerpsMarketApi.klineList, {
    pairId: req.pairId,
    interval: req.interval,
    ...(req.beforeOpenTime != null ? { beforeOpenTime: req.beforeOpenTime } : {}),
  });
}

/** GET /market/store/trades/{pairId} */
export function listMarketTrades(pairId: number) {
  return request.get<MarketTradeListRsp>(PerpsMarketApi.trades(pairId));
}

/** GET /market/store/order-book/{pairId} */
export function getMarketOrderBook(pairId: number) {
  return request.get<MarketBidsAndAsksRsp>(PerpsMarketApi.orderBook(pairId));
}
