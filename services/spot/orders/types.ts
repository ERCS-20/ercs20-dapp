/** Query pair by base + quote token (pairCode = `{baseToken}_{quoteToken}`). */
export type GetPairByCodeReq = {
  baseToken: string;
  quoteToken: string;
};

/** Mirrors `exchange.orbix.spot.orders.api.dto.PairRsp`. BigInteger → string in JSON. */
export type PairRsp = {
  id: number;
  pairCode: string;
  blockNumber: string;
  logIndex: number;
  txHash: string;
  baseTokenAddress: string;
  quoteTokenAddress: string;
  minTradeAmount: string;
  maxPriceFluctuation: number;
  issuePrice: string;
  enginePriceDecimal: number;
  expiresAt: string;
};
