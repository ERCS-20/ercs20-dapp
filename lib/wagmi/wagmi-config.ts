import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

import { publicEnv } from "@/lib/config/public-env";
import { supportedChains } from "@/lib/web3/chains";

const projectId =
  publicEnv.walletConnectProjectId.trim() ||
  "00000000000000000000000000000000";

const transports = Object.fromEntries(
  supportedChains.map((chain) => {
    const url = chain.rpcUrls.default.http[0];
    return [chain.id, http(url)];
  })
);

export const wagmiConfig = getDefaultConfig({
  appName: "Orbix",
  projectId,
  chains: [...supportedChains],
  ssr: true,
  transports,
});
