"use client";

import { useApiQuery } from "@/lib/api/hooks";
import { getUserBalance, listUserBalances, paginationDeposits } from "@/services/spot/accounts/api";
import type {
  DepositsPaginationReq,
  DepositsPaginationRsp,
  UserBalancesRsp,
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