/**
 * Static token artwork in `public/tokens/{SYMBOL}.svg` (SYMBOL uppercase, e.g. USDC.svg, OBX.svg).
 */
export function getTokenIconSrc(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  return `/tokens/${s}.svg`;
}
