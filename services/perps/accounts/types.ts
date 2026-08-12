import type { PaginationCondition, PaginationRepertory } from "@/lib/api/pagination";
import type { ApiBigInt } from "@/lib/utils/coerce-bigint";

/** Mirrors `exchange.orbix.perps.accounts.dto.UserBalancesReq`. */
export type PerpsUserBalancesReq = {
  tokenAddress: string;
};

/** Mirrors `exchange.orbix.perps.accounts.dto.UserBalancesRsp`. */
export type PerpsUserBalancesRsp = {
  id: number;
  userId: number;
  tokenAddress: string;
  symbol: string;
  availableBalance: string;
  frozenBalance: string;
  version: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

/** Mirrors `exchange.orbix.perps.accounts.dto.DepositsPaginationReq`. */
export type PerpsDepositsPaginationCondition = {
  symbol?: string;
  status?: string;
};

/** Mirrors `exchange.orbix.perps.accounts.dto.DepositsRsp`. */
export type PerpsDepositsRsp = {
  userId: number;
  tokenAddress: string;
  symbol: string;
  amount: string;
  fromAddress: string;
  toAddress: string;
  status: string;
  confirmedAt: string | null;
};

export type PerpsDepositsPaginationReq = PaginationCondition<PerpsDepositsPaginationCondition>;
export type PerpsDepositsPaginationRsp = PaginationRepertory<PerpsDepositsRsp>;

/** Mirrors `exchange.orbix.perps.accounts.dto.WithdrawalsPaginationReq`. */
export type PerpsWithdrawalsPaginationCondition = {
  symbol?: string;
  status?: string;
};

/** Mirrors `exchange.orbix.perps.accounts.dto.WithdrawalsRsp`. */
export type PerpsWithdrawalsRsp = {
  id: number;
  userId: number;
  tokenAddress: string;
  symbol: string;
  amount: ApiBigInt;
  fromAddress: string;
  toAddress: string;
  status: string;
  txHash: string;
  /** On-chain `withdraw(orderId, …)` — same value used when DAO signed sysSignature. */
  salt: ApiBigInt;
  /** Backend withdrawDAO EIP-712 signature authorizing vault `withdraw`. */
  sysSignature: string;
  createdAt: string;
  updatedAt: string;
};

export type PerpsWithdrawalsPaginationReq =
  PaginationCondition<PerpsWithdrawalsPaginationCondition>;
export type PerpsWithdrawalsPaginationRsp = PaginationRepertory<PerpsWithdrawalsRsp>;

/** Mirrors `exchange.orbix.perps.accounts.dto.WithdrawalsDetailReq`. */
export type PerpsWithdrawalsDetailReq = {
  id: number;
};

/** Mirrors `exchange.orbix.perps.accounts.dto.AccountLedgerReq`. */
export type PerpsAccountLedgerPaginationCondition = {
  tokenAddress: string;
  bizType?: string;
  bizSubType?: string;
};

/** Mirrors `exchange.orbix.perps.accounts.dto.AccountLedgerRsp`. */
export type PerpsAccountLedgerRsp = {
  tokenAddress: string;
  deltaAvailable: string;
  deltaFrozen: string;
  bizType: string;
  bizSubType: string;
  refId: string;
  remark: string | null;
  createdAt: string;
};

export type PerpsAccountLedgerPaginationReq =
  PaginationCondition<PerpsAccountLedgerPaginationCondition>;
export type PerpsAccountLedgerPaginationRsp = PaginationRepertory<PerpsAccountLedgerRsp>;
