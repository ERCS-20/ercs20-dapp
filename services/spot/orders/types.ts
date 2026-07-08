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

/** Mirrors `exchange.orbix.spot.orders.dto.OrderSaltRsp`. */
export type OrderSaltRsp = {
  /** Order / withdraw anti-replay salt (uint64 as string). */
  salt: string;
};

/** Mirrors `exchange.orbix.spot.orders.dto.WithdrawReq`. BigInteger → string in JSON. */
export type WithdrawApplyReq = {
  userBalancesId: number;
  fromAddress: string;
  tokenAddress: string;
  amount: string;
  salt: string;
  signature: string;
};
