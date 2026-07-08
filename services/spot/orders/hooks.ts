"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { applyWithdraw, getOrderSalt, getPairByCode } from "@/services/spot/orders/api";
import type { OrderSaltRsp, PairRsp, WithdrawApplyReq } from "@/services/spot/orders/types";

export function usePairByCode(
  baseToken: string | undefined,
  quoteToken: string | undefined
) {
  return useApiQuery<PairRsp>({
    queryKey: ["spot", "orders", "pair", baseToken?.toLowerCase(), quoteToken?.toLowerCase()],
    queryFn: () =>
      getPairByCode({
        baseToken: baseToken!,
        quoteToken: quoteToken!,
      }),
    enabled: Boolean(baseToken && quoteToken),
    staleTime: 60_000,
  });
}

/** Fetch a fresh order/withdraw salt before EIP-712 signing. */
export function useOrderSalt() {
  return useApiMutation<OrderSaltRsp, Error, void>({
    mutationFn: () => getOrderSalt(),
  });
}

export function useApplyWithdraw() {
  const queryClient = useQueryClient();

  return useApiMutation<void, Error, WithdrawApplyReq>({
    mutationFn: (req) => applyWithdraw(req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spot", "accounts"] });
    },
  });
}
