/** Static chain artwork in `public/chains/{Name}.svg`. */
const CHAIN_ICON_FILES: Record<string, string> = {
  Hardhat: "Hardhat",
  "Arc Testnet": "Arc",
};

export function getChainIconSrc(chainName: string): string {
  const file =
    CHAIN_ICON_FILES[chainName] ??
    chainName.trim().split(/\s+/)[0] ??
    "Hardhat";
  return `/chains/${file}.svg`;
}
