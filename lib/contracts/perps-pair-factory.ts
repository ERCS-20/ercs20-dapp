import type { Abi, PublicClient } from "viem";

import { perpsPairFactoryAbi } from "@/lib/contracts/abis";

type WriteContractAsync = (params: {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  chainId: number;
  account?: `0x${string}`;
}) => Promise<`0x${string}`>;

/** PerpsPairFactory `fee()` — listing fee in native currency wei. */
export async function readPerpsPairFactoryFee(params: {
  publicClient: PublicClient;
  factoryAddress: `0x${string}`;
}): Promise<bigint> {
  const { publicClient, factoryAddress } = params;
  return (await publicClient.readContract({
    address: factoryAddress,
    abi: perpsPairFactoryAbi,
    functionName: "fee",
  })) as bigint;
}

/** PerpsPairFactory `isMarket(baseToken)`. */
export async function readPerpsMarketExists(params: {
  publicClient: PublicClient;
  factoryAddress: `0x${string}`;
  baseToken: `0x${string}`;
}): Promise<boolean> {
  const { publicClient, factoryAddress, baseToken } = params;
  return (await publicClient.readContract({
    address: factoryAddress,
    abi: perpsPairFactoryAbi,
    functionName: "isMarket",
    args: [baseToken],
  })) as boolean;
}

/**
 * PerpsPairFactory `create(baseToken, openingTime)` — payable; `msg.value` must equal `fee()`.
 * `openingTime` is Unix seconds.
 */
export async function executePerpsPairFactoryCreate(params: {
  publicClient: PublicClient;
  account: `0x${string}`;
  writeContractAsync: WriteContractAsync;
  factoryAddress: `0x${string}`;
  baseToken: `0x${string}`;
  openingTime: bigint;
  fee: bigint;
  chainId: number;
}): Promise<`0x${string}`> {
  const {
    publicClient,
    account,
    writeContractAsync,
    factoryAddress,
    baseToken,
    openingTime,
    fee,
    chainId,
  } = params;

  const request = {
    address: factoryAddress,
    abi: perpsPairFactoryAbi,
    functionName: "create" as const,
    args: [baseToken, openingTime] as const,
    value: fee,
    chainId,
    account,
  };

  await publicClient.simulateContract(request);
  return writeContractAsync(request);
}
