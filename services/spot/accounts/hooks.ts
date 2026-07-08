"use client";

import { useApiQuery } from "@/lib/api/hooks";
import {
  getUserBalance,
  getWithdrawalDetail,
  listUserBalances,
  paginationAccountLedger,
  paginationDeposits,
  paginationWithdrawals,
} from "@/services/spot/accounts/api";
import type {
  AccountLedgerPaginationReq,
  AccountLedgerPaginationRsp,
  DepositsPaginationReq,
  DepositsPaginationRsp,
  UserBalancesRsp,
  WithdrawalsPaginationReq,
  WithdrawalsPaginationRsp,
  WithdrawalsRsp,
} from "@/services/spot/accounts/types";

export function useUserBalance(
  tokenAddress: string | undefined,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};

  return useApiQuery<UserBalancesRsp>({
    queryKey: ["spot", "accounts", "balance", tokenAddress?.toLowerCase()],
    queryFn: () =>
      getUserBalance({
        tokenAddress: tokenAddress!,
      }),
    enabled: enabled && Boolean(tokenAddress),
    notifyError: false,
    retry: false,
    staleTime: 30_000,
  });
}

export function useUserBalancesList(options?: {
  enabled?: boolean;
  notifyError?: boolean;
}) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<UserBalancesRsp[]>({
    queryKey: ["spot", "accounts", "balances", "list"],
    queryFn: () => listUserBalances(),
    enabled,
    notifyError,
    staleTime: 30_000,
  });
}

export function useDepositsPagination(
  req: DepositsPaginationReq,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<DepositsPaginationRsp>({
    queryKey: ["spot", "accounts", "deposits", "pagination", req],
    queryFn: () => paginationDeposits(req),
    enabled,
    notifyError,
    staleTime: 30_000,
  });
}

export function useWithdrawalsPagination(
  req: WithdrawalsPaginationReq,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<WithdrawalsPaginationRsp>({
    queryKey: ["spot", "accounts", "withdrawals", "pagination", req],
    queryFn: () => paginationWithdrawals(req),
    enabled,
    notifyError,
    staleTime: 30_000,
  });
}

export function useWithdrawalDetail(
  id: number | undefined,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<WithdrawalsRsp>({
    queryKey: ["spot", "accounts", "withdrawals", "detail", id],
    queryFn: () => getWithdrawalDetail({ id: id! }),
    enabled: enabled && id != null,
    notifyError,
    staleTime: 30_000,
  });
}

export function useAccountLedgerPagination(
  req: AccountLedgerPaginationReq,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<AccountLedgerPaginationRsp>({
    queryKey: ["spot", "accounts", "account-ledger", "pagination", req],
    queryFn: () => paginationAccountLedger(req),
    enabled: enabled && Boolean(req.condition?.tokenAddress),
    notifyError,
    staleTime: 30_000,
  });
}