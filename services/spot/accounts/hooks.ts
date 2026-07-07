"use client";

import { useApiQuery } from "@/lib/api/hooks";
import { getUserBalance } from "@/services/spot/accounts/api";
import type { UserBalancesRsp } from "@/services/spot/accounts/types";

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
