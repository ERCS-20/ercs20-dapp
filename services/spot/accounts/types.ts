import type { PaginationCondition, PaginationRepertory } from "@/lib/api/pagination";

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

/** Mirrors `exchange.orbix.spot.users.dto.DepositsPaginationReq`. */
export type DepositsPaginationCondition = {
  symbol?: string;
  status?: string;
};

/** Mirrors `exchange.orbix.spot.users.dto.DepositsRsp`. BigInteger → string in JSON. */
export type DepositsRsp = {
  userId: number;
  tokenAddress: string;
  symbol: string;
  amount: string;
  fromAddress: string;
  toAddress: string;
  status: string;
  confirmedAt: string | null;
};

export type DepositsPaginationReq = PaginationCondition<DepositsPaginationCondition>;
export type DepositsPaginationRsp = PaginationRepertory<DepositsRsp>;
