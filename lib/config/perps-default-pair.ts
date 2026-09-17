import { publicEnv } from "@/lib/config/public-env";

/** URL segment for default perps pair, e.g. `obx/usdc`. */
export function getPerpsDefaultPairPath(): string {
  const base = publicEnv.perpsDefaultBaseTokenSymbol.toLowerCase();
  const quote = publicEnv.perpsDefaultQuoteTokenSymbol.toLowerCase();
  return `${base}/${quote}`;
}

export function getPerpsDefaultBaseTokenSymbol(): string {
  return publicEnv.perpsDefaultBaseTokenSymbol;
}

export function getPerpsDefaultQuoteTokenSymbol(): string {
  return publicEnv.perpsDefaultQuoteTokenSymbol;
}
