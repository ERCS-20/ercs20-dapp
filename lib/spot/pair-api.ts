import type { PairRsp } from "@/services/spot/orders/types";
import {
  orderQuoteAmountBaseUnits,
  pairRspToTradingPair,
} from "@/lib/market/pair-api";
import {
  pairLabel,
  pairLabelFromCode,
  pairPath,
  pairPathFromCode,
  pairPathFromSymbols,
  parsePairCode,
} from "@/lib/market/pair";
import type { SpotPair } from "@/lib/spot/types";

export {
  orderQuoteAmountBaseUnits,
  pairLabel,
  pairLabelFromCode,
  pairPath,
  pairPathFromCode,
  pairPathFromSymbols,
  parsePairCode,
};

export function pairRspToSpotPair(pair: PairRsp): SpotPair {
  return pairRspToTradingPair(pair);
}
