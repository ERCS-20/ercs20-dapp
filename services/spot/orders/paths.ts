/** Spot orders REST path constants. */
export const SpotOrdersApi = {
  pairByTokens: (baseToken: string, quoteToken: string) =>
    `/orders/pairs/${encodeURIComponent(baseToken)}/${encodeURIComponent(quoteToken)}`,
} as const;
