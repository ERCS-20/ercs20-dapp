import { hardhat, mainnet, sepolia } from "wagmi/chains";

import { publicEnv } from "@/lib/config/public-env";

const CHAINS_BY_ID: ReadonlyMap<number, (typeof mainnet) | (typeof sepolia) | (typeof hardhat)> =
  new Map(
    [mainnet, sepolia, hardhat].map((c) => [c.id, c])
  );

/** Target chain for ERCS-20 swap (from `NEXT_PUBLIC_CHAIN_ID`). */
export function getSwapTargetChainId(): number | undefined {
  const id = publicEnv.chainId;
  if (id == null || !Number.isFinite(id) || id <= 0) return undefined;
  return id;
}

export function getSwapTargetChain():
  | (typeof mainnet)
  | (typeof sepolia)
  | (typeof hardhat)
  | undefined {
  const id = getSwapTargetChainId();
  if (id == null) return undefined;
  return CHAINS_BY_ID.get(id);
}

export function getErcs20FactoryAddress(): `0x${string}` | undefined {
  const a = publicEnv.ercs20FactoryAddress?.trim();
  if (!a || !a.startsWith("0x") || a.length < 42) return undefined;
  return a as `0x${string}`;
}

export function getDefaultErcs20TokenAddress(): `0x${string}` | undefined {
  const a = publicEnv.defaultErcs20Token?.trim();
  if (!a || !a.startsWith("0x") || a.length < 42) return undefined;
  return a as `0x${string}`;
}

export function isSwapTargetChainKnown(): boolean {
  const id = getSwapTargetChainId();
  return id != null && CHAINS_BY_ID.has(id);
}

export function isSwapEnvConfigured(): boolean {
  return (
    isSwapTargetChainKnown() &&
    getErcs20FactoryAddress() != null
  );
}
