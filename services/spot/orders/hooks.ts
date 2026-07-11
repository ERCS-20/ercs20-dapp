"use client";

import { useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";

import { parsePairCode } from "@/lib/spot/pair-api";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { applyWithdraw, getOrderSalt, getPairByCode, paginationOrders, paginationOrdersHistory, paginationOrdersTradeHistory } from "@/services/spot/orders/api";
import type { MarketPairRsp } from "@/services/spot/market/types";
import type {
  OrderSaltRsp,
  OrdersHistoryPaginationReq,
  OrdersHistoryPaginationRsp,
  OrdersPaginationReq,
  OrdersPaginationRsp,
  OrdersTradeHistoryPaginationReq,
  OrdersTradeHistoryPaginationRsp,
  PairRsp,
  WithdrawApplyReq,
} from "@/services/spot/orders/types";

export function pairByCodeQueryKey(baseToken: string, quoteToken: string) {
  return ["spot", "orders", "pair", baseToken.toLowerCase(), quoteToken.toLowerCase()] as const;
}

export function usePairByCode(
  baseToken: string | undefined,
  quoteToken: string | undefined,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<PairRsp>({
    queryKey: pairByCodeQueryKey(baseToken ?? "", quoteToken ?? ""),
    queryFn: () =>
      getPairByCode({
        baseToken: baseToken!,
        quoteToken: quoteToken!,
      }),
    enabled: enabled && Boolean(baseToken && quoteToken),
    notifyError,
    retry: false,
    staleTime: 60_000,
  });
}

/** pairId → enginePriceDecimal from orders `getPairByCode` (shared react-query cache). */
export function usePairEnginePriceDecimalMap(marketPairs: MarketPairRsp[]) {
  const lookups = useMemo(() => {
    const items: { pairId: number; base: string; quote: string }[] = [];
    const seenPairIds = new Set<number>();

    for (const row of marketPairs) {
      if (seenPairIds.has(row.pairId)) continue;
      seenPairIds.add(row.pairId);

      const parsed = parsePairCode(row.code);
      if (!parsed) continue;
      items.push({ pairId: row.pairId, base: parsed.base, quote: parsed.quote });
    }
    return items;
  }, [marketPairs]);

  const queries = useQueries({
    queries: lookups.map(({ base, quote }) => ({
      queryKey: pairByCodeQueryKey(base, quote),
      queryFn: () => getPairByCode({ baseToken: base, quoteToken: quote }),
      staleTime: 60_000,
      retry: false,
    })),
  });

  return useMemo(() => {
    const map = new Map<number, number>();
    lookups.forEach(({ pairId }, i) => {
      const dec = queries[i]?.data?.enginePriceDecimal;
      if (typeof dec === "number") map.set(pairId, dec);
    });
    return map;
  }, [lookups, queries]);
}

/** Fetch a fresh order/withdraw salt before EIP-712 signing. */
export function useOrderSalt() {
  return useApiMutation<OrderSaltRsp, Error, void>({
    mutationFn: () => getOrderSalt(),
  });
}

export function useOrdersPagination(
  req: OrdersPaginationReq,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<OrdersPaginationRsp>({
    queryKey: ["spot", "orders", "open", "pagination", req],
    queryFn: () => paginationOrders(req),
    enabled,
    notifyError,
    staleTime: 30_000,
  });
}

export function useOrdersHistoryPagination(
  req: OrdersHistoryPaginationReq,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<OrdersHistoryPaginationRsp>({
    queryKey: ["spot", "orders", "history", "pagination", req],
    queryFn: () => paginationOrdersHistory(req),
    enabled,
    notifyError,
    staleTime: 30_000,
  });
}

export function useOrdersTradeHistoryPagination(
  req: OrdersTradeHistoryPaginationReq,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<OrdersTradeHistoryPaginationRsp>({
    queryKey: ["spot", "orders", "trade-history", "pagination", req],
    queryFn: () => paginationOrdersTradeHistory(req),
    enabled,
    notifyError,
    staleTime: 30_000,
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
