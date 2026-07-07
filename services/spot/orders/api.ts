import { request } from "@/lib/api/request";
import { SpotOrdersApi } from "@/services/spot/orders/paths";
import type { GetPairByCodeReq, PairRsp } from "@/services/spot/orders/types";

/** GET /orders/pairs/{baseToken}/{quoteToken} */
export function getPairByCode(req: GetPairByCodeReq) {
  const baseToken = req.baseToken.toUpperCase();
  const quoteToken = req.quoteToken.toUpperCase();
  return request.get<PairRsp>(SpotOrdersApi.pairByTokens(baseToken, quoteToken));
}
