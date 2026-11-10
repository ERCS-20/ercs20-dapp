/** Static preview only. Stake asset is the protocol token (OBX). */

export const STAKE_SYMBOL = "OBX";
export const SUMMARY_REWARD_SYMBOL = "USDC";

export type PoolMarket = "spot" | "perps";

export const poolSummaries: Record<
  PoolMarket,
  { myStaked: string; totalStaked: string; myRewards: string; totalRewards: string }
> = {
  spot: {
    myStaked: "12,480",
    totalStaked: "8,420,150",
    myRewards: "128.40",
    totalRewards: "186,420.18",
  },
  perps: {
    myStaked: "3,200",
    totalStaked: "750,000",
    myRewards: "42.18",
    totalRewards: "9,060.00",
  },
};

export type PreviewPool = {
  id: string;
  market: PoolMarket;
  symbol: string;
  name: string;
  /** `null` when nothing is staked — the card shows Infinity. */
  apr: string | null;
  rewards: string;
  staked: string;
  open: boolean;
  stakedByMe: boolean;
  myRewards: string;
  myStaked: string;
  balance: string;
  canHarvest: boolean;
  canUnstake: boolean;
};

export const previewPools: PreviewPool[] = [
  {
    id: "usdc",
    market: "spot",
    symbol: "USDC",
    name: "USD Coin",
    apr: "18.40",
    rewards: "42,180.55",
    staked: "1,240,000",
    open: true,
    stakedByMe: true,
    myRewards: "128.40",
    myStaked: "2,500",
    balance: "9,980",
    canHarvest: true,
    canUnstake: true,
  },
  {
    id: "aapl",
    market: "spot",
    symbol: "AAPL",
    name: "Apple Inc.",
    apr: "64.20",
    rewards: "1,280",
    staked: "860,000",
    open: true,
    stakedByMe: false,
    myRewards: "0",
    myStaked: "0",
    balance: "9,980",
    canHarvest: false,
    canUnstake: false,
  },
  {
    id: "nvda",
    market: "perps",
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    apr: "32.50",
    rewards: "8,420",
    staked: "540,000",
    open: true,
    stakedByMe: true,
    myRewards: "42.18",
    myStaked: "3,200",
    balance: "9,980",
    canHarvest: true,
    canUnstake: true,
  },
  {
    id: "tsla",
    market: "perps",
    symbol: "TSLA",
    name: "Tesla Inc.",
    apr: "9.10",
    rewards: "640",
    staked: "210,000",
    open: false,
    stakedByMe: false,
    myRewards: "0",
    myStaked: "0",
    balance: "9,980",
    canHarvest: false,
    canUnstake: false,
  },
];
