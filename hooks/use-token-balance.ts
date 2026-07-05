"use client";

import type { Address } from "viem";
import { useReadContract } from "wagmi";

import { erc20Abi } from "@/lib/contracts/abis";

/**
 * ERC-20 `balanceOf(account)` only (single `eth_call`).
 * Prefer this over `useBalance({ token })`, which batches `symbol`/`decimals` and can fail on non-standard tokens.
 */
export function useTokenBalance({
  token,
  address,
  chainId,
  query,
}: {
  token: `0x${string}` | undefined;
  address: `0x${string}` | undefined;
  chainId: number | undefined;
  query?: { enabled?: boolean };
}) {
  const balanceOfArgs: readonly [Address] | undefined =
    token && address && chainId != null ? [address] : undefined;

  const result = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: balanceOfArgs,
    chainId,
    query: {
      ...query,
      enabled:
        balanceOfArgs != null && (query?.enabled ?? true),
    },
  });

  return { ...result, data: result.data as bigint | undefined };
}
