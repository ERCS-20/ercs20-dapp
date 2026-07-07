import { isNativeUsdcDepositAddress } from "@/lib/contracts/global-spot-vault";
import { getWusdcAddress } from "@/lib/config/wusdc";

/**
 * Map UI token address → spot account balance API token address.
 * Native USDC (zero address) is stored as WUSDC on the backend after deposit.
 */
export function resolveSpotBalanceTokenAddress(
  tokenAddress: string | undefined
): string | undefined {
  if (!tokenAddress) return undefined;
  if (isNativeUsdcDepositAddress(tokenAddress)) {
    return getWusdcAddress();
  }
  return tokenAddress;
}
