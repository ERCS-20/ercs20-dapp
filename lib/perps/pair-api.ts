import type { PairRsp } from "@/services/perps/orders/types";
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
import type { PerpsPair } from "@/lib/perps/types";

export {
  orderQuoteAmountBaseUnits,
  pairLabel,
  pairLabelFromCode,
  pairPath,
  pairPathFromCode,
  pairPathFromSymbols,
  parsePairCode,
};

export function pairRspToPerpsPair(pair: PairRsp): PerpsPair {
  return pairRspToTradingPair(pair);
}
