"use client";

import { useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";

import { parsePairCode } from "@/lib/spot/pair-api";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { addUserPair, applyWithdraw, cancelOrder, deleteUserPair, getOrderSalt, getOrdersUserBalance, getPairBalances, getPairByCode, listOrders, listUserPairs, paginationOrdersHistory, paginationOrdersTradeHistory, placeOrder, reorderUserPairs } from "@/services/spot/orders/api";
import type { MarketPairRsp } from "@/services/spot/market/types";
import type {
  CancelOrderReq,
  OrderSaltRsp,
  OrdersHistoryPaginationReq,
  OrdersHistoryPaginationRsp,
  OrdersListRsp,
  OrdersTradeHistoryPaginationReq,
  OrdersTradeHistoryPaginationRsp,
  OrdersUserBalanceRsp,
  OrdersUserBalancesPairRsp,
  PairRsp,
  PlaceOrderReq,
  UserPairAddReq,
  UserPairDeleteReq,
  UserPairsReorderReq,
  UserPairsRsp,
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

export function useOrdersList(options?: { enabled?: boolean; notifyError?: boolean }) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<OrdersListRsp>({
    queryKey: ["spot", "orders", "open", "list"],
    queryFn: () => listOrders(),
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

export function ordersUserBalanceQueryKey(tokenAddress: string) {
  return ["spot", "orders", "user-balance", tokenAddress.toLowerCase()] as const;
}

export function ordersPairBalancesQueryKey(
  baseTokenAddress: string,
  quoteTokenAddress: string
) {
  return [
    "spot",
    "orders",
    "user-balances-pair",
    baseTokenAddress.toLowerCase(),
    quoteTokenAddress.toLowerCase(),
  ] as const;
}

/** Single-token spot balance (orders service in-memory cache). */
export function useOrdersUserBalance(
  tokenAddress: string | undefined,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<OrdersUserBalanceRsp>({
    queryKey: ordersUserBalanceQueryKey(tokenAddress ?? ""),
    queryFn: () =>
      getOrdersUserBalance({
        tokenAddress: tokenAddress!,
      }),
    enabled: enabled && Boolean(tokenAddress),
    notifyError,
    staleTime: 30_000,
  });
}

/** Pair base/quote spot balances for trading (orders service in-memory cache). */
export function usePairBalances(
  baseTokenAddress: string | undefined,
  quoteTokenAddress: string | undefined,
  options?: { enabled?: boolean; notifyError?: boolean }
) {
  const { enabled = true, notifyError = false } = options ?? {};

  return useApiQuery<OrdersUserBalancesPairRsp>({
    queryKey: ordersPairBalancesQueryKey(baseTokenAddress ?? "", quoteTokenAddress ?? ""),
    queryFn: () =>
      getPairBalances({
        baseTokenAddress: baseTokenAddress!,
        quoteTokenAddress: quoteTokenAddress!,
      }),
    enabled: enabled && Boolean(baseTokenAddress && quoteTokenAddress),
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

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useApiMutation<void, Error, PlaceOrderReq>({
    mutationFn: (req) => placeOrder(req),
    // Form maps ErrorCode → i18n (e.g. INSUFFICIENT_BALANCE → 余额不足).
    notifyError: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spot", "orders", "open"] });
      void queryClient.invalidateQueries({ queryKey: ["spot", "orders", "user-balances-pair"] });
    },
  });
}

export function userPairsQueryKey() {
  return ["spot", "orders", "user-pairs"] as const;
}

/** POST /orders/userPairs/pairs — favorite / pinned pairs for the signed-in user. */
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
        queryKey: ["spot", "market", "pairs", "user-pairs"],
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
        queryKey: ["spot", "market", "pairs", "user-pairs"],
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
        queryKey: ["spot", "market", "pairs", "user-pairs"],
      });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useApiMutation<void, Error, CancelOrderReq>({
    mutationFn: (req) => cancelOrder(req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["spot", "orders", "open"] });
      void queryClient.invalidateQueries({ queryKey: ["spot", "orders", "history"] });
      void queryClient.invalidateQueries({ queryKey: ["spot", "orders", "user-balances-pair"] });
      void queryClient.invalidateQueries({ queryKey: ["spot", "orders", "user-balance"] });
    },
  });
}
