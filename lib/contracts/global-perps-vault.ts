import type { Abi } from "viem";

import { globalPerpsVaultAbi } from "@/lib/contracts/abis";

type WriteContractAsync = (params: {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  chainId: number;
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
