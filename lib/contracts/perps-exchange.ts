import type { Abi, PublicClient } from "viem";

import perpsExchangeAbiJson from "@/lib/contracts/abi/PerpsExchange.json";

const perpsExchangeAbi = perpsExchangeAbiJson as Abi;

type WriteContractAsync = (params: {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  chainId: number;
  account?: `0x${string}`;
}) => Promise<`0x${string}`>;

type MarginWriteParams = {
  publicClient?: PublicClient;
  account?: `0x${string}`;
  writeContractAsync: WriteContractAsync;
  exchangeAddress: `0x${string}`;
  marketId: bigint;
  amount: bigint;
  chainId: number;
};

async function executeMarginWrite(
  functionName: "addMargin" | "withdrawMargin",
  params: MarginWriteParams
): Promise<`0x${string}`> {
  const {
    publicClient,
    account,
    writeContractAsync,
    exchangeAddress,
    marketId,
    amount,
    chainId,
  } = params;

  const request = {
    address: exchangeAddress,
    abi: perpsExchangeAbi,
    functionName,
    args: [marketId, amount] as const,
    chainId,
    account,
  };

  if (publicClient && account) {
    await publicClient.simulateContract(request);
  }

  return writeContractAsync(request);
}

/** PerpsExchange `addMargin(marketId, amount)`. */
export function executePerpsAddMargin(params: MarginWriteParams) {
  return executeMarginWrite("addMargin", params);
}

/** PerpsExchange `withdrawMargin(marketId, amount)`. */
export function executePerpsWithdrawMargin(params: MarginWriteParams) {
  return executeMarginWrite("withdrawMargin", params);
}
