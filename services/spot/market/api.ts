import { request } from "@/lib/api/request";
import { SpotMarketApi } from "@/services/spot/market/paths";
import type {
  KlineCurrentDayReq,
  MarketKlineRsp,
  MarketOrderBookListRsp,
  MarketPairsPaginationReq,
  MarketPairsPaginationRsp,
  MarketTradeListRsp,
} from "@/services/spot/market/types";

/** POST /market/store/pairs/pagination */
export function paginationMarketPairs(req: MarketPairsPaginationReq) {
  return request.post<MarketPairsPaginationRsp>(SpotMarketApi.pairsPagination, req);
}

/** POST /market/store/kline/current-day */
export function getKlineCurrentDay(req: KlineCurrentDayReq) {
  return request.post<MarketKlineRsp>(SpotMarketApi.klineCurrentDay, {
    pairId: req.pairId,
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
