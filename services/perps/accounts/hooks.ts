"use client";

import { useApiQuery } from "@/lib/api/hooks";
import { getPerpsNativeTokenAddress } from "@/lib/config/perps-native-token";
import {
  getPerpsUserBalance,
  listPerpsUserBalances,
  paginationPerpsAccountLedger,
  paginationPerpsDeposits,
  paginationPerpsWithdrawals,
} from "@/services/perps/accounts/api";
import type {
  PerpsAccountLedgerPaginationReq,
  PerpsAccountLedgerPaginationRsp,
  PerpsDepositsPaginationReq,
  PerpsDepositsPaginationRsp,
  PerpsUserBalancesRsp,
  PerpsWithdrawalsPaginationReq,
  PerpsWithdrawalsPaginationRsp,
} from "@/services/perps/accounts/types";

export function perpsUserBalanceQueryKey(tokenAddress?: string) {
  const token = (tokenAddress ?? getPerpsNativeTokenAddress()).toLowerCase();
  return ["perps", "accounts", "balance", token] as const;
}

/** Single-token perps account balance (native USDC by default). */
export function usePerpsUserBalance(options?: {
  tokenAddress?: string;
  enabled?: boolean;
}) {
  const { tokenAddress, enabled = true } = options ?? {};
  const token = (tokenAddress ?? getPerpsNativeTokenAddress()).toLowerCase();

  return useApiQuery<PerpsUserBalancesRsp>({
    queryKey: perpsUserBalanceQueryKey(token),
    queryFn: () => getPerpsUserBalance({ tokenAddress: token }),
    enabled: enabled && Boolean(token),
    notifyError: false,
    retry: false,
    staleTime: 30_000,
  });
}

export function usePerpsUserBalancesList(options?: {
  enabled?: boolean;
  notifyError?: boolean;
}) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<PerpsUserBalancesRsp[]>({
    queryKey: ["perps", "accounts", "balances", "list"],
    queryFn: () => listPerpsUserBalances(),
    enabled,
    notifyError,
    staleTime: 30_000,
  });
}

export function usePerpsDepositsPagination(
  req: PerpsDepositsPaginationReq,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};

  return useApiQuery<PerpsDepositsPaginationRsp>({
    queryKey: ["perps", "accounts", "deposits", "pagination", req],
    queryFn: () => paginationPerpsDeposits(req),
    enabled,
    staleTime: 15_000,
  });
}

export function usePerpsWithdrawalsPagination(
  req: PerpsWithdrawalsPaginationReq,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<PerpsWithdrawalsPaginationRsp>({
    queryKey: ["perps", "accounts", "withdrawals", "pagination", req],
    queryFn: () => paginationPerpsWithdrawals(req),
    enabled,
    notifyError,
    staleTime: 30_000,
  });
}

export function usePerpsAccountLedgerPagination(
  req: PerpsAccountLedgerPaginationReq,
  options?: { enabled?: boolean }
) {
  const { enabled = true } = options ?? {};

  return useApiQuery<PerpsAccountLedgerPaginationRsp>({
    queryKey: ["perps", "accounts", "account-ledger", "pagination", req],
    queryFn: () => paginationPerpsAccountLedger(req),
    enabled: enabled && Boolean(req.condition?.tokenAddress),
    staleTime: 15_000,
  });
}
