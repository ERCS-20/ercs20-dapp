import type { PaginationCondition, PaginationRepertory } from "@/lib/api/pagination";
import type { ApiBigInt } from "@/lib/utils/coerce-bigint";

/** Mirrors `exchange.orbix.blockchain.data.api.dto.Ercs20Req`. */
export type Ercs20Req = {
  contractAddress?: string;
  symbol?: string;
};

/** Mirrors `exchange.orbix.blockchain.data.api.dto.Ercs20Rsp`. BigInteger → string/bigint via json-with-bigint. */
export type Ercs20Rsp = {
  id: number;
  contract: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  /** USDC seed / opening price in 18-decimal base units. */
  usdcSeedAmount: ApiBigInt;
};

export type Ercs20PaginationReq = PaginationCondition<Ercs20Req>;
export type Ercs20PaginationRsp = PaginationRepertory<Ercs20Rsp>;
