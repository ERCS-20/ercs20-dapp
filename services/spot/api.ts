import { request } from "@/lib/api/request";
import { SpotApi } from "@/services/spot/paths";
import type { GetPairByCodeReq, PairRsp } from "@/services/spot/types";

/** GET /orders/pairs/{baseToken}/{quoteToken} */
export function getPairByCode(req: GetPairByCodeReq) {
  const baseToken = req.baseToken.toUpperCase();
  const quoteToken = req.quoteToken.toUpperCase();
  return request.get<PairRsp>(SpotApi.pairByTokens(baseToken, quoteToken));
}
