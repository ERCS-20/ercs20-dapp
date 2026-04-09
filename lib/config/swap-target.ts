import { publicEnv } from "@/lib/config/public-env";
import { getAppChainId, getChainById, isSupportedChainId } from "@/lib/web3/chains";
import type { Chain } from "viem";

/** Target chain for ERCS-20 swap (`NEXT_PUBLIC_CHAIN_ID` must match a supported chain). */
export function getSwapTargetChainId(): number | undefined {
  return getAppChainId();
}

export function getSwapTargetChain(): Chain | undefined {
  const id = getSwapTargetChainId();
  if (id == null) return undefined;
  return getChainById(id);
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
  return id != null && isSupportedChainId(id);
}

export function isSwapEnvConfigured(): boolean {
  return isSwapTargetChainKnown() && getErcs20FactoryAddress() != null;
}
