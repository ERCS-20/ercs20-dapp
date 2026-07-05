import { zeroAddress } from "viem";

import type { Ercs20Rsp } from "@/services/chain/types";

/** Native USDC placeholder — zero address, no ERC-20 contract. */
export function createNativeUsdcToken(): Ercs20Rsp {
  return {
    id: 0,
    contract: zeroAddress,
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
    totalSupply: "0",
    usdcSeedAmount: "0",
  };
}

export function isNativeUsdcToken(token: Pick<Ercs20Rsp, "contract" | "symbol">): boolean {
  return (
    token.symbol.toUpperCase() === "USDC" &&
    token.contract.toLowerCase() === zeroAddress
  );
}
