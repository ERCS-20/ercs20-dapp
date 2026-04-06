import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";
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

/**
 * `wallet_switchEthereumChain` / `wallet_addEthereumChain` use `chain.rpcUrls`.
 * Stock `hardhat` from viem is always `http://127.0.0.1:8545`, ignoring `transports`.
 */
const hardhatChain = defineChain({
  ...hardhat,
  rpcUrls: {
    ...hardhat.rpcUrls,
    default: {
      http: hardhatRpc ? [hardhatRpc] : [...hardhat.rpcUrls.default.http],
    },
  },
});

export const wagmiConfig = getDefaultConfig({
  appName: "ERCS-20",
  projectId,
  chains: [mainnet, sepolia, hardhatChain],
  ssr: true,
  transports: {
    [mainnet.id]: http(mainnetRpc ? mainnetRpc : undefined),
    [sepolia.id]: http(sepoliaRpc ? sepoliaRpc : undefined),
    [hardhatChain.id]: http(hardhatRpc ? hardhatRpc : undefined),
  },
});
