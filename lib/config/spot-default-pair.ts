import { publicEnv } from "@/lib/config/public-env";

/** URL segment for default spot pair, e.g. `obx/usdc`. */
export function getSpotDefaultPairPath(): string {
  const base = publicEnv.spotDefaultBaseTokenSymbol.toLowerCase();
  const quote = publicEnv.spotDefaultQuoteTokenSymbol.toLowerCase();
  return `${base}/${quote}`;
}

export function getSpotDefaultBaseTokenSymbol(): string {
  return publicEnv.spotDefaultBaseTokenSymbol;
}

export function getSpotDefaultQuoteTokenSymbol(): string {
  return publicEnv.spotDefaultQuoteTokenSymbol;
}
