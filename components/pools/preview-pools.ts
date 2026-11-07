/** Static preview only. Stake asset is the protocol token (OBX). */

export const STAKE_SYMBOL = "OBX";
export const SUMMARY_REWARD_SYMBOL = "USDC";

export const poolSummary = {
  myStaked: "12,480",
  totalStaked: "8,420,150",
  /** Matches the USDC pool, the only position in this preview. */
  myRewards: "128.40",
  totalRewards: "186,420.18",
};

export type PreviewPool = {
  id: string;
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
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    apr: null,
    rewards: "0",
    staked: "0",
    open: true,
    stakedByMe: false,
    myRewards: "0",
    myStaked: "0",
    balance: "9,980",
    canHarvest: false,
    canUnstake: false,
  },
  {
    id: "tsla",
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
