import type { PublicClient } from "viem";
import { getAddress, isAddress } from "viem";

import { ercs20TokenAbi } from "@/lib/contracts/ercs20-abi";
import type { Ercs20TokenMeta } from "@/lib/tokens/ercs20-types";

export async function readErcs20TokenMeta(
  client: PublicClient,
  token: `0x${string}`
): Promise<Ercs20TokenMeta> {
  const [name, symbol] = await Promise.all([
    client.readContract({
      address: token,
      abi: ercs20TokenAbi,
      functionName: "name",
    }),
    client.readContract({
      address: token,
      abi: ercs20TokenAbi,
      functionName: "symbol",
    }),
  ]);
  return {
    address: getAddress(token),
    name: String(name),
    symbol: String(symbol),
  };
}

export function assertValidErcs20Address(q: string): `0x${string}` | undefined {
  if (!q || !isAddress(q)) return undefined;
  try {
    return getAddress(q);
  } catch {
    return undefined;
  }
}
