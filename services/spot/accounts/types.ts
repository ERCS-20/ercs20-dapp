/** Mirrors `exchange.orbix.spot.users.dto.UserBalancesReq`. */
export type UserBalancesReq = {
  tokenAddress: string;
};

/** Mirrors `exchange.orbix.spot.users.dto.UserBalancesRsp`. BigInteger → string in JSON. */
export type UserBalancesRsp = {
  id: number;
  userId: number;
  tokenAddress: string;
  symbol: string;
  availableBalance: string;
  frozenBalance: string;
  userBalancesHash: number;
  version: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};
