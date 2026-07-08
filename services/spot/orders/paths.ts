/** Spot orders REST path constants. */
export const SpotOrdersApi = {
  pairByTokens: (baseToken: string, quoteToken: string) =>
    `/orders/pairs/${encodeURIComponent(baseToken)}/${encodeURIComponent(quoteToken)}`,
  orderSalt: "/orders/orders/salt",
  withdrawalsApply: "/orders/withdrawals/apply",
} as const;
