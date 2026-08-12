"use client";

import { useMemo } from "react";
import { useReadContract } from "wagmi";

import { ercs20TokenAbi } from "@/lib/contracts/abis";
import { quotePerTokenFromReserves } from "@/lib/swap/pool-price";
import { formatSubscriptPrice } from "@/lib/utils/price";

const QUOTE_DECIMALS = 18;

/**
 * ERCS-20 opening / mid price from on-chain `getReserves()`:
 * quote per 1 token (no swap fee), same as Swap card.
 */
export function useErcs20OpeningPrice(options: {
  tokenAddress?: `0x${string}`;
  tokenDecimals?: number;
  chainId?: number;
  enabled?: boolean;
}) {
  const {
    tokenAddress,
    tokenDecimals = 18,
    chainId,
    enabled = true,
  } = options;

  const {
    data: reserves,
    isLoading,
    isError,
    isFetching,
  } = useReadContract({
    address: tokenAddress,
    abi: ercs20TokenAbi,
    functionName: "getReserves",
    chainId,
    query: {
      enabled: enabled && Boolean(tokenAddress) && chainId != null,
      staleTime: 15_000,
    },
  });

  const price = useMemo(() => {
    if (!reserves || !Array.isArray(reserves)) return null;
    const tokenReserve = reserves[0] as bigint;
    const quoteReserve = reserves[1] as bigint;
    return quotePerTokenFromReserves(
      tokenReserve,
      quoteReserve,
      tokenDecimals,
      QUOTE_DECIMALS
    );
  }, [reserves, tokenDecimals]);

  const label =
    price == null ? null : `${formatSubscriptPrice(price, 8)} USDC`;

  return {
    price,
    label,
    isLoading: isLoading || isFetching,
    isError,
    hasValidPrice: price != null && price > 0,
  };
}
