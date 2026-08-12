"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { getPerpsNativeTokenAddress } from "@/lib/config/perps-native-token";
import {
  applyPerpsWithdraw,
  getPerpsOrderSalt,
  getPerpsOrdersUserBalance,
} from "@/services/perps/orders/api";
import type {
  PerpsOrderSaltRsp,
  PerpsOrdersUserBalanceRsp,
  PerpsWithdrawApplyReq,
} from "@/services/perps/orders/types";

export function perpsOrdersUserBalanceQueryKey(tokenAddress?: string) {
  const token = (tokenAddress ?? getPerpsNativeTokenAddress()).toLowerCase();
  return ["perps", "orders", "user-balance", token] as const;
}

/** In-memory available balance for perps withdraw apply. */
export function usePerpsOrdersUserBalance(options?: {
  tokenAddress?: string;
  enabled?: boolean;
  notifyError?: boolean;
}) {
  const { tokenAddress, enabled = true, notifyError = false } = options ?? {};
  const token = (tokenAddress ?? getPerpsNativeTokenAddress()).toLowerCase();

  return useApiQuery<PerpsOrdersUserBalanceRsp>({
    queryKey: perpsOrdersUserBalanceQueryKey(token),
    queryFn: () => getPerpsOrdersUserBalance({ tokenAddress: token }),
    enabled: enabled && Boolean(token),
    notifyError,
    staleTime: 30_000,
  });
}

export function usePerpsOrderSalt() {
  return useApiMutation<PerpsOrderSaltRsp, Error, void>({
    mutationFn: () => getPerpsOrderSalt(),
  });
}

export function useApplyPerpsWithdraw() {
  const queryClient = useQueryClient();

  return useApiMutation<void, Error, PerpsWithdrawApplyReq>({
    mutationFn: (req) => applyPerpsWithdraw(req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["perps", "orders", "user-balance"] });
      void queryClient.invalidateQueries({ queryKey: ["perps", "accounts"] });
    },
  });
}
