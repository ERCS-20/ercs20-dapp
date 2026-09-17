"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { getPerpsNativeTokenAddress } from "@/lib/config/perps-native-token";
import {
  getPerpsUserBalance,
  listPerpsUserBalances,
  listUserPairs,
  paginationPerpsAccountLedger,
  paginationPerpsDeposits,
  paginationPerpsWithdrawals,
  addUserPair,
  deleteUserPair,
  reorderUserPairs,
} from "@/services/perps/accounts/api";
import type {
  PerpsAccountLedgerPaginationReq,
  PerpsAccountLedgerPaginationRsp,
  PerpsDepositsPaginationReq,
  PerpsDepositsPaginationRsp,
  PerpsUserBalancesRsp,
  PerpsWithdrawalsPaginationReq,
  PerpsWithdrawalsPaginationRsp,
  UserPairAddReq,
  UserPairDeleteReq,
  UserPairsReorderReq,
  UserPairsRsp,
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

export function userPairsQueryKey() {
  return ["perps", "accounts", "user-pairs"] as const;
}

/** POST /accounts/userPairs/pairs — favorite / pinned pairs for the signed-in user. */
export function useUserPairs(options?: {
  enabled?: boolean;
  notifyError?: boolean;
}) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<UserPairsRsp>({
    queryKey: userPairsQueryKey(),
    queryFn: () => listUserPairs(),
    enabled,
    notifyError,
    staleTime: 30_000,
  });
}

export function useAddUserPair() {
  const queryClient = useQueryClient();

  return useApiMutation<UserPairsRsp, Error, UserPairAddReq>({
    mutationFn: (req) => addUserPair(req),
    onSuccess: (data) => {
      queryClient.setQueryData(userPairsQueryKey(), data);
      void queryClient.invalidateQueries({
        queryKey: ["perps", "market", "pairs", "user-pairs"],
      });
    },
  });
}

export function useDeleteUserPair() {
  const queryClient = useQueryClient();

  return useApiMutation<UserPairsRsp, Error, UserPairDeleteReq>({
    mutationFn: (req) => deleteUserPair(req),
    onSuccess: (data) => {
      queryClient.setQueryData(userPairsQueryKey(), data);
      void queryClient.invalidateQueries({
        queryKey: ["perps", "market", "pairs", "user-pairs"],
      });
    },
  });
}

export function useReorderUserPairs() {
  const queryClient = useQueryClient();

  return useApiMutation<void, Error, UserPairsReorderReq>({
    mutationFn: (req) => reorderUserPairs(req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userPairsQueryKey() });
      void queryClient.invalidateQueries({
        queryKey: ["perps", "market", "pairs", "user-pairs"],
      });
    },
  });
}
