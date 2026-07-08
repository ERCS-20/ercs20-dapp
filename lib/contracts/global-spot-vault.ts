import type { Abi, PublicClient } from "viem";
import { zeroAddress } from "viem";

import { erc20Abi, globalSpotVaultAbi } from "@/lib/contracts/abis";

/** UI placeholder / mock USDC — zero address means native USDC (`depositUSDC`). */
export function isNativeUsdcDepositAddress(tokenAddress: string): boolean {
  return tokenAddress.toLowerCase() === zeroAddress;
}

type WriteContractAsync = (params: {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  chainId: number;
}) => Promise<`0x${string}`>;

export async function readVaultErc20Allowance(params: {
  publicClient: PublicClient;
  tokenAddress: `0x${string}`;
  owner: `0x${string}`;
  vaultAddress: `0x${string}`;
}): Promise<bigint> {
  const { publicClient, tokenAddress, owner, vaultAddress } = params;
  return (await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, vaultAddress],
  })) as bigint;
}

export async function approveTokenForVault(params: {
  publicClient: PublicClient;
  writeContractAsync: WriteContractAsync;
  tokenAddress: `0x${string}`;
  vaultAddress: `0x${string}`;
  amount: bigint;
  chainId: number;
}): Promise<void> {
  const { publicClient, writeContractAsync, tokenAddress, vaultAddress, amount, chainId } =
    params;

  const approveHash = await writeContractAsync({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [vaultAddress, amount],
    chainId,
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
}

/**
 * GlobalSpotVault deposit only (no approve):
 * - zero address → `depositUSDC()` (payable)
 * - ERC-20 → `deposit(token, amount)`
 */
export async function executeGlobalSpotVaultDeposit(params: {
  writeContractAsync: WriteContractAsync;
  vaultAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  amount: bigint;
  chainId: number;
}): Promise<`0x${string}`> {
  const { writeContractAsync, vaultAddress, tokenAddress, amount, chainId } = params;

  if (isNativeUsdcDepositAddress(tokenAddress)) {
    return writeContractAsync({
      address: vaultAddress,
      abi: globalSpotVaultAbi,
      functionName: "depositUSDC",
      value: amount,
      chainId,
    });
  }

  return writeContractAsync({
    address: vaultAddress,
    abi: globalSpotVaultAbi,
    functionName: "deposit",
    args: [tokenAddress, amount],
    chainId,
  });
}

/** GlobalSpotVault `withdraw(orderId, token, amount, signature)` — claim awaiting withdrawal. */
export async function executeGlobalSpotVaultWithdraw(params: {
  publicClient?: PublicClient;
  account?: `0x${string}`;
  writeContractAsync: WriteContractAsync;
  vaultAddress: `0x${string}`;
  orderId: bigint;
  tokenAddress: `0x${string}`;
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
    tokenAddress,
    amount,
    signature,
    chainId,
  } = params;

  const request = {
    address: vaultAddress,
    abi: globalSpotVaultAbi,
    functionName: "withdraw" as const,
    args: [orderId, tokenAddress, amount, signature] as const,
    chainId,
    account,
  };

  if (publicClient && account) {
    await publicClient.simulateContract(request);
  }

  return writeContractAsync(request);
}
