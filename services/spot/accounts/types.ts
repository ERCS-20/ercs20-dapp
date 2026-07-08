import type { PaginationCondition, PaginationRepertory } from "@/lib/api/pagination";
import type { ApiBigInt } from "@/lib/utils/coerce-bigint";

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

/** Mirrors `exchange.orbix.spot.users.dto.WithdrawalsPaginationReq`. */
export type WithdrawalsPaginationCondition = {
  symbol?: string;
  status?: string;
};

/** Mirrors `exchange.orbix.spot.users.dto.WithdrawalsRsp`. BigInteger fields parsed as bigint via json-with-bigint. */
export type WithdrawalsRsp = {
  id: number;
  userId: number;
  tokenAddress: string;
  symbol: string;
  amount: ApiBigInt;
  fromAddress: string;
  toAddress: string;
  status: string;
  txHash: string;
  /** On-chain `withdraw(orderId)` — same value used when DAO signed sysSignature. */
  salt: ApiBigInt;
  /** Backend withdrawDAO EIP-712 signature authorizing vault `withdraw`. */
  sysSignature: string;
  createdAt: string;
  updatedAt: string;
};

export type WithdrawalsPaginationReq = PaginationCondition<WithdrawalsPaginationCondition>;
export type WithdrawalsPaginationRsp = PaginationRepertory<WithdrawalsRsp>;

/** Mirrors `exchange.orbix.spot.users.dto.WithdrawalsDetailReq`. */
export type WithdrawalsDetailReq = {
  id: number;
};

/** Mirrors `exchange.orbix.spot.users.dto.AccountLedgerReq`. */
export type AccountLedgerPaginationCondition = {
  tokenAddress: string;
  bizType?: string;
  bizSubType?: string;
};

/** Mirrors `exchange.orbix.spot.users.dto.AccountLedgerRsp`. BigInteger → string in JSON. */
export type AccountLedgerRsp = {
  tokenAddress: string;
  deltaAvailable: string;
  deltaFrozen: string;
  bizType: string;
  bizSubType: string;
  refId: string;
  remark: string | null;
  createdAt: string;
};

export type AccountLedgerPaginationReq = PaginationCondition<AccountLedgerPaginationCondition>;
export type AccountLedgerPaginationRsp = PaginationRepertory<AccountLedgerRsp>;
