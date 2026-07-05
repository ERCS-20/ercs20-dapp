import { isNativeVaultToken } from "@/lib/config/asset-vault";
import { createNativeUsdcToken } from "@/lib/profile/native-usdc-token";
import { findObxQuickPickToken } from "@/lib/profile/quick-pick-tokens";
import type { Ercs20Rsp } from "@/services/chain/types";

export function resolveInitialProfileToken(
  tokens: Ercs20Rsp[],
  tokenParam: string | null
): Ercs20Rsp | undefined {
  if (tokenParam) {
    if (isNativeVaultToken(tokenParam)) {
      return createNativeUsdcToken();
    }
    const match = tokens.find((t) => t.contract.toLowerCase() === tokenParam.toLowerCase());
    if (match) return match;
  }

  const obx = findObxQuickPickToken(tokens);
  return obx;
}
