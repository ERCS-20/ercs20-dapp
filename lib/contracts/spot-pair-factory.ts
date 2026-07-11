import type { Abi, PublicClient } from "viem";

import { spotPairFactoryAbi } from "@/lib/contracts/abis";

type WriteContractAsync = (params: {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  chainId: number;
  account?: `0x${string}`;
}) => Promise<`0x${string}`>;

/** SpotPairFactory `create(baseToken)` — pairs base token with vault WUSDC. */
export async function executeSpotPairFactoryCreate(params: {
  publicClient: PublicClient;
  account: `0x${string}`;
  writeContractAsync: WriteContractAsync;
  factoryAddress: `0x${string}`;
  baseToken: `0x${string}`;
  chainId: number;
}): Promise<`0x${string}`> {
  const { publicClient, account, writeContractAsync, factoryAddress, baseToken, chainId } =
    params;

  const request = {
    address: factoryAddress,
    abi: spotPairFactoryAbi,
    functionName: "create" as const,
    args: [baseToken] as const,
    chainId,
    account,
  };

  await publicClient.simulateContract(request);
  return writeContractAsync(request);
}

export async function readSpotPairExists(params: {
  publicClient: PublicClient;
  factoryAddress: `0x${string}`;
  baseToken: `0x${string}`;
  quoteToken: `0x${string}`;
}): Promise<boolean> {
  const { publicClient, factoryAddress, baseToken, quoteToken } = params;
  return (await publicClient.readContract({
    address: factoryAddress,
    abi: spotPairFactoryAbi,
    functionName: "isPair",
    args: [baseToken, quoteToken],
  })) as boolean;
}
