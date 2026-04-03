/** Chain IDs used by the app; extend as you add networks. */
export const CHAIN_IDS = {
  mainnet: 1,
  sepolia: 11155111,
} as const;

export type SupportedChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];
