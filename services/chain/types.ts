import type { PaginationCondition, PaginationRepertory } from "@/lib/api/pagination";

/** Mirrors `exchange.orbix.blockchain.data.api.dto.Ercs20Req`. */
export type Ercs20Req = {
  contractAddress?: string;
  symbol?: string;
};

/** Mirrors `exchange.orbix.blockchain.data.api.dto.Ercs20Rsp`. BigInteger → string in JSON. */
export type Ercs20Rsp = {
  id: number;
  contract: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  usdcSeedAmount: string;
};

export type Ercs20PaginationReq = PaginationCondition<Ercs20Req>;
export type Ercs20PaginationRsp = PaginationRepertory<Ercs20Rsp>;
