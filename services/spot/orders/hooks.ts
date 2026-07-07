"use client";

import { useApiQuery } from "@/lib/api/hooks";
import { getPairByCode } from "@/services/spot/orders/api";
import type { PairRsp } from "@/services/spot/orders/types";

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
