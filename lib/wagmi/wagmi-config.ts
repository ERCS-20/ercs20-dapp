import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { hardhat, mainnet, sepolia } from "wagmi/chains";

import { publicEnv } from "@/lib/config/public-env";
import { CHAIN_IDS } from "@/lib/web3/chains";
import { getRpcUrl } from "@/lib/web3/config";

const projectId =
  publicEnv.walletConnectProjectId.trim() ||
  "00000000000000000000000000000000";

const mainnetRpc = getRpcUrl(CHAIN_IDS.mainnet);
const sepoliaRpc = getRpcUrl(CHAIN_IDS.sepolia);
const hardhatRpc = getRpcUrl(CHAIN_IDS.hardhat);

export const wagmiConfig = getDefaultConfig({
  appName: "ERCS-20",
  projectId,
  chains: [mainnet, sepolia, hardhat],
  ssr: true,
  transports: {
    [mainnet.id]: http(mainnetRpc ? mainnetRpc : undefined),
    [sepolia.id]: http(sepoliaRpc ? sepoliaRpc : undefined),
    [hardhat.id]: http(hardhatRpc ? hardhatRpc : undefined),
  },
});
