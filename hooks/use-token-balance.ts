"use client";

import type { Address } from "viem";
import { useReadContract } from "wagmi";

import { erc20ReadAbi } from "@/lib/contracts/erc20";

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

  return useReadContract({
    address: token,
    abi: erc20ReadAbi,
    functionName: "balanceOf",
    args: balanceOfArgs,
    chainId,
    query: {
      ...query,
      enabled:
        balanceOfArgs != null && (query?.enabled ?? true),
    },
  });
}
