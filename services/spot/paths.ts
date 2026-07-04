/** Spot REST path constants — avoid magic strings in api.ts. */
export const SpotApi = {
  pairByTokens: (baseToken: string, quoteToken: string) =>
    `/orders/pairs/${encodeURIComponent(baseToken)}/${encodeURIComponent(quoteToken)}`,
} as const;
