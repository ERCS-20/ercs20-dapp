import type { Abi, PublicClient } from "viem";

import { globalPerpsVaultAbi } from "@/lib/contracts/abis";

type WriteContractAsync = (params: {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  chainId: number;
  account?: `0x${string}`;
}) => Promise<`0x${string}`>;

/**
 * GlobalPerpsVault `deposit()` — ARC native USDC via `msg.value` (no ERC-20 approve).
 */
export async function executeGlobalPerpsVaultDeposit(params: {
  writeContractAsync: WriteContractAsync;
  vaultAddress: `0x${string}`;
  amount: bigint;
  chainId: number;
}): Promise<`0x${string}`> {
  const { writeContractAsync, vaultAddress, amount, chainId } = params;

  return writeContractAsync({
    address: vaultAddress,
    abi: globalPerpsVaultAbi,
    functionName: "deposit",
    value: amount,
    chainId,
  });
}

/** GlobalPerpsVault `withdraw(orderId, amount, signature)` — claim awaiting withdrawal. */
export async function executeGlobalPerpsVaultWithdraw(params: {
  publicClient?: PublicClient;
  account?: `0x${string}`;
  writeContractAsync: WriteContractAsync;
  vaultAddress: `0x${string}`;
  orderId: bigint;
  amount: bigint;
  signature: `0x${string}`;
  chainId: number;
}): Promise<`0x${string}`> {
  const {
    publicClient,
    account,
    writeContractAsync,
    vaultAddress,
    orderId,
    amount,
    signature,
    chainId,
  } = params;

  const request = {
    address: vaultAddress,
    abi: globalPerpsVaultAbi,
    functionName: "withdraw" as const,
    args: [orderId, amount, signature] as const,
    chainId,
    account,
  };

  if (publicClient && account) {
    await publicClient.simulateContract(request);
  }

  return writeContractAsync(request);
}
