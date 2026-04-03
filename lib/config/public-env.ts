/**
 * Public environment placeholders (fill in `.env.local`).
 * Client-safe keys must use the `NEXT_PUBLIC_` prefix.
 * (Keys keep `ERCS20` without hyphen; product naming in UI is ERCS-20.)
 */

export const publicEnv = {
  walletConnectProjectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "") || undefined,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? "",
  ercs20FactoryAddress:
    process.env.NEXT_PUBLIC_ERCS20_FACTORY_ADDRESS ??
    process.env.NEXT_PUBLIC_ERC20_FACTORY_ADDRESS ??
    "",
  defaultErcs20Token: process.env.NEXT_PUBLIC_DEFAULT_ERCS20_TOKEN ?? "",
} as const;
