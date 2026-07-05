import { getDefaultErcs20TokenAddress } from "@/lib/config/swap-target";
import { createNativeUsdcToken } from "@/lib/profile/native-usdc-token";
import type { Ercs20Rsp } from "@/services/chain/types";

/** OBX from pagination list, env default address, or minimal stub. */
export function findObxQuickPickToken(tokens: Ercs20Rsp[]): Ercs20Rsp | undefined {
  const envAddr = getDefaultErcs20TokenAddress();
  if (envAddr) {
    const byEnv = tokens.find((t) => t.contract.toLowerCase() === envAddr.toLowerCase());
    if (byEnv) return byEnv;
    return {
      id: 0,
      contract: envAddr,
      name: "OBX",
      symbol: "OBX",
      decimals: 18,
      totalSupply: "0",
      usdcSeedAmount: "0",
    };
  }
  return tokens.find((t) => t.symbol.toUpperCase() === "OBX");
}

export function findUsdcQuickPickToken(): Ercs20Rsp {
  return createNativeUsdcToken();
}

export function getProfileTokenQuickPicks(tokens: Ercs20Rsp[]): Ercs20Rsp[] {
  const obx = findObxQuickPickToken(tokens);
  const usdc = findUsdcQuickPickToken();
  const picks: Ercs20Rsp[] = [];
  if (obx) picks.push(obx);
  if (!picks.some((t) => t.contract === usdc.contract && t.symbol === usdc.symbol)) {
    picks.push(usdc);
  }
  return picks;
}
