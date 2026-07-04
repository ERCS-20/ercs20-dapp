/** Minimal ABI for exchange asset vault (`deposit`). */
export const assetVaultAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;
