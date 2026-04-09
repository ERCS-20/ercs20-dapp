export const en = {
  brand: "ERCS-20",
  nav: {
    swap: "Swap",
    spot: "Spot",
    futures: "Futures",
    pools: "Pools",
    ercs20: "ERCS-20",
  },
  common: {
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    roadmap: "Roadmap",
  },
  wallet: {
    connect: "Connect",
    connectPlaceholder: "WalletConnect will be enabled in the next step. Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID when ready.",
    wrongNetworkDialogDesc:
      "Your wallet is on a different network than this app expects. Switch below to use Swap and Deploy.",
    wrongNetworkLater: "Not now",
  },
  home: {
    heroBadge: "ERCS-20",
    heroTitle: "Sovereign liquidity for equity-style tokens.",
    heroSubtitle: "ERCS-20 mints its full supply into a built-in AMM, prices against a native quote asset, and routes trading fees back to the issuer—without approval traps for buyers and sellers.",
    learnMore: "Learn more",
    protocolEyebrow: "Protocol",
    protocolTitle: "How ERCS-20 works",
    ctaSwap: "Swap",
    ctaErcs20: "Deploy",
    heroFeatureAmm: "Sport",
    heroFeatureTrade: "Futures",
    heroFeatureFees: "Pools",
  },
  swap: {
    title: "Swap",
    settingsPlaceholder: "Adjust slippage and deadline below.",
    sell: "Sell",
    buy: "Buy",
    pay: "Pay",
    receive: "Receive",
    balance: "Balance",
    selectToken: "Select token",
    enterAmount: "0",
    flip: "Flip direction",
    settings: "Transaction settings",
    slippage: "Slippage (basis points)",
    deadline: "Deadline (minutes)",
    rate: "Rate",
    review: "Review",
    swapAction: "Swap",
    native: "USDC",
    stock: "Token",
    wrongNetwork: "Wrong network",
    switchNetwork: "Switch network",
    envNotConfigured:
      "Set NEXT_PUBLIC_CHAIN_ID and NEXT_PUBLIC_ERCS20_FACTORY_ADDRESS in .env.local.",
    pickToken: "Select an ERCS-20 token",
    searchTokens: "Symbol or 0x address (factory uses exact symbol)",
    noTokenResults: "No tokens found",
    loading: "Loading…",
    insufficientBalance: "Insufficient balance",
    confirmWallet: "Confirm in wallet",
    confirming: "Confirming…",
    swapSuccess: "Transaction confirmed",
    swapFailed: "Transaction failed",
    currentPrice: "Current price",
    saveSettings: "Save",
    slippageBpsHint: "50 = 0.5%. Maximum 5000 (50%).",
    deadlineHint: "1–1440 minutes.",
    outputEstimate: "Estimated output",
    disconnectedHint: "Connect wallet to swap",
    invalidAmount: "Invalid amount",
  },
  ercs20: {
    title: "Deploy ERCS-20",
    subtitle:
      "Launch an ERCS-20 you control with on-chain liquidity. When people trade through the protocol, part of the fees flows back to you—so rewards track real usage, not the deploy alone.",
    name: "Name",
    symbol: "Symbol",
    price: "Price (quote per token)",
    pricePlaceholder: "Enter total supply and initial quote",
    totalSupply: "Total supply",
    seedQuote: "Initial quote reserve (seed)",
    ownerAddress: "Owner address",
    ownerConnectWallet: "Connect wallet",
    submit: "Deploy",
    toastNeedWallet: "Wallet required",
    toastNeedWalletDesc: "Connect your wallet to set the owner address.",
    toastWrongNetwork: "Wrong network",
    toastWrongNetworkDesc: "Switch to the configured chain before deploying.",
    toastNeedName: "Name required",
    toastNeedNameDesc: "Enter a name for your token.",
    toastNeedSymbol: "Symbol required",
    toastNeedSymbolDesc: "Enter a ticker symbol.",
    toastNeedSupply: "Total supply required",
    toastNeedSupplyDesc: "Enter a valid amount (18 decimals, greater than zero).",
    toastNeedSeed: "Initial quote required",
    toastNeedSeedDesc: "Enter a valid initial quote (18 decimals, greater than zero).",
    deploySuccessTitle: "Deployed successfully",
    deploySuccessSubtitle:
      "Your ERCS-20 is live on-chain. Keep this contract address for listings and swaps.",
    tokenContractAddress: "Token contract",
    registryIndex: "Factory index",
    copyAddress: "Copy",
    copyFailed: "Could not copy",
    addressCopied: "Address copied",
    deployAnother: "Deploy another",
    deployParseFailed:
      "Transaction confirmed, but the token address could not be read from event logs.",
    txHashLabel: "Transaction",
    createFailed: "Create failed",
    hint: "Confirm the transaction in your wallet.",
  },
  phase2: {
    detailBody: `In its current form, the ERCS-20 pool is initialized with a fixed inventory on-chain. Because it does not continuously replenish liquidity like a mature venue, prices can become highly volatile under thin-liquidity conditions or during large trades.

To address this critical weakness, the project evolves from a single AMM pool into a full decentralized exchange system designed to provide persistent liquidity and deeper market depth.

Orbix & OBX (note / risk disclosure)

Exchange: Orbix (website: orbix.exchange) is the planned decentralized exchange for expanding liquidity in the ERCS-20 ecosystem. Its goal is to provide deeper market depth and to serve as the execution layer for spot markets, derivatives, and incentive mechanisms over time.

Protocol token: Orbix DAO (symbol: OBX) is the first token introduced for the ERCS-20 ecosystem. It is intended for exchange-stage staking/mining programs, fee distribution, and broader ecosystem incentives (final mechanics depend on the production release).

Experimental positioning: Orbix and OBX form an ERCS-20 experimental sandbox to validate the feasibility and boundaries of "liquidity sovereignty," fee recapture, and the non-dilutive financing narrative under real market conditions.

High-risk disclaimer: This project is under active development and experimentation. Smart-contract risk, mechanism/design risk, liquidity risk, and severe price volatility may occur. Please do your own research and understand the rules and risks before participating. Participate cautiously and within your means. Nothing in this repository constitutes investment advice.`,
    detailRoadmap: `We ship in two phases:

Phase 1: Uniswap-style exchange experience (UI first)
Build a front-end and interactive swap page so users can exchange ERCS20 with the quote asset conveniently. This phase focuses on usability and trading-entry experience: users should not need to understand contract internals to trade reliably.

Phase 2: dYdX-style decentralized exchange (spot + futures) + staking mining
Deploy a more complete DEX:
• Support spot and futures trading.
• Use a dYdX-like workflow of off-chain signing + on-chain settlement (orders are signed off-chain, then validated and settled on-chain).
• Add staking & mining: users stake a protocol token to participate in mining.
• Fee distribution: exchange fees are split into two portions—one for project/platform operations, and the other allocated to mining rewards via the staking platform.

By starting with a practical trading entry and progressively upgrading into a liquidity-sustaining venue with derivatives and incentives, the community can begin using and validating early while forming a healthier liquidity and reward loop over time.`,
    spot: {
      title: "Spot",
    },
    futures: {
      title: "Futures",
    },
    pools: {
      title: "Pools",
    },
  },
} as const;

