import { formatUnits, parseUnits } from "viem";

/** Marginal pool price: quote received for 1 full token (no swap fee). */
export function quotePerTokenFromReserves(
  tokenReserve: bigint,
  quoteReserve: bigint,
  tokenDecimals: number,
  quoteDecimals = 18
): number | null {
  if (tokenReserve <= BigInt(0) || quoteReserve <= BigInt(0)) return null;

  try {
    const oneToken = parseUnits("1", tokenDecimals);
    const quoteWei = (quoteReserve * oneToken) / tokenReserve;
    const n = Number(formatUnits(quoteWei, quoteDecimals));
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
