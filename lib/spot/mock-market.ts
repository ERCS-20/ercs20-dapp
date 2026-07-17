import defaultList from "@/lib/tokens/ercs20-default-list.json";
import type { Ercs20TokenMeta } from "@/lib/tokens/ercs20-types";
import { getDefaultErcs20TokenAddress } from "@/lib/config/swap-target";
import { getWusdcAddress } from "@/lib/config/wusdc";

import type {
  ChartTimeframe,
  OrderBookLevel,
  SpotMarketStats,
  SpotMarketTrade,
  SpotOrderBook,
  SpotPair,
  SpotUserTrade,
} from "./types";

const QUOTE_SYMBOL = "USDC";
const DEFAULT_QUOTE_ADDRESS =
  getWusdcAddress() ?? ("0x0000000000000000000000000000000000000000" as `0x${string}`);

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getSpotPairs(): SpotPair[] {
  const envDefault = getDefaultErcs20TokenAddress();
  const list = defaultList as Ercs20TokenMeta[];
  const seen = new Set<string>();
  const pairs: SpotPair[] = [];

  for (const t of list) {
    const addr = t.address.toLowerCase();
    if (seen.has(addr)) continue;
    seen.add(addr);
    pairs.push(toPair(t));
  }

  if (envDefault && !seen.has(envDefault.toLowerCase())) {
    const meta = list.find(
      (t) => t.address.toLowerCase() === envDefault.toLowerCase()
    );
    pairs.unshift(
      meta
        ? toPair(meta)
        : {
            baseSymbol: "TOKEN",
            baseName: "Token",
            baseAddress: envDefault,
            quoteSymbol: QUOTE_SYMBOL,
            quoteAddress: DEFAULT_QUOTE_ADDRESS,
            pairCode: `TOKEN/${QUOTE_SYMBOL}`,
          }
    );
  }

  if (pairs.length === 0) {
    pairs.push({
      baseSymbol: "OBX",
      baseName: "Orbix DAO",
      baseAddress: "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be",
      quoteSymbol: QUOTE_SYMBOL,
      quoteAddress: DEFAULT_QUOTE_ADDRESS,
      pairCode: "OBX/USDC",
    });
  }

  return pairs;
}

function toPair(t: Ercs20TokenMeta): SpotPair {
  return {
    baseSymbol: t.symbol,
    baseName: t.name,
    baseAddress: t.address,
    quoteSymbol: QUOTE_SYMBOL,
    quoteAddress: DEFAULT_QUOTE_ADDRESS,
    pairCode: `${t.symbol}/${QUOTE_SYMBOL}`,
  };
}

export function pairLabel(pair: SpotPair): string {
  return pair.pairCode;
}

export function pairPath(pair: SpotPair): string {
  return `${pair.baseSymbol.toLowerCase()}/${pair.quoteSymbol.toLowerCase()}`;
}

export function findPairByPath(
  pairs: SpotPair[],
  token0: string,
  token1: string
): SpotPair | undefined {
  const a = token0.toLowerCase();
  const b = token1.toLowerCase();
  return pairs.find(
    (p) =>
      p.baseSymbol.toLowerCase() === a &&
      p.quoteSymbol.toLowerCase() === b
  );
}

export function getMockMarketStats(pair: SpotPair): SpotMarketStats {
  const seed = hashSeed(pair.baseSymbol);
  const lastPrice = 0.42 + (seed % 500) / 1000;
  const change = ((seed % 200) - 100) / 20;
  const volumeBase = 280_000 + (seed % 120_000);
  return {
    lastPrice,
    change24hPct: change,
    high24h: lastPrice * (1 + Math.abs(change) / 100 + 0.02),
    low24h: lastPrice * (1 - Math.abs(change) / 100 - 0.02),
    volume24h: volumeBase * lastPrice,
    volumeBase,
  };
}

function buildSideLevels(
  mid: number,
  side: "ask" | "bid",
  count: number
): OrderBookLevel[] {
  const step = mid * 0.0012;
  const levels: OrderBookLevel[] = [];
  for (let i = 0; i < count; i++) {
    const price =
      side === "ask" ? mid + step * (i + 1) : mid - step * (i + 1);
    levels.push({
      price,
      size: 200 + ((i * 137) % 900) + i * 40,
    });
  }
  return side === "ask" ? levels.reverse() : levels;
}

export function getMockOrderBook(pair: SpotPair): SpotOrderBook {
  const { lastPrice } = getMockMarketStats(pair);
  const asks = buildSideLevels(lastPrice, "ask", 10);
  const bids = buildSideLevels(lastPrice, "bid", 10);
  const bestAsk = asks[asks.length - 1]?.price ?? lastPrice;
  const bestBid = bids[0]?.price ?? lastPrice;
  const spread = Math.max(bestAsk - bestBid, 0);
  return {
    asks,
    bids,
    midPrice: lastPrice,
    spread,
    spreadPct: lastPrice > 0 ? (spread / lastPrice) * 100 : 0,
  };
}

export function getMockMarketTrades(pair: SpotPair): SpotMarketTrade[] {
  const seed = hashSeed(pair.pairCode);
  const { lastPrice } = getMockMarketStats(pair);
  const trades: SpotMarketTrade[] = [];
  for (let i = 0; i < 20; i++) {
    const jitter = ((seed + i * 13) % 100) / 10_000;
    trades.push({
      id: `${pair.baseSymbol}-mt-${i}`,
      price: lastPrice * (1 + (i % 2 === 0 ? jitter : -jitter)),
      quantity: 50 + ((seed + i * 29) % 400),
      isBuy: i % 3 !== 0,
      time: Date.now() - i * 45_000,
    });
  }
  return trades;
}

export function getMockUserTradeHistory(pair: SpotPair): SpotUserTrade[] {
  const seed = hashSeed(`${pair.pairCode}-history`);
  const { lastPrice } = getMockMarketStats(pair);
  return Array.from({ length: 8 }, (_, i) => ({
    id: `${pair.baseSymbol}-ut-${i}`,
    pairLabel: pair.pairCode,
    side: i % 2 === 0 ? "buy" : "sell",
    price: lastPrice * (1 + (i - 4) / 500),
    quantity: 100 + ((seed + i) % 300),
    fee: 0.05 + i * 0.01,
    txHash: `0x${(seed + i).toString(16).padStart(64, "0").slice(0, 64)}`,
    time: Date.now() - i * 3600_000,
  }));
}

export function getMockChartBars(
  pair: SpotPair,
  timeframe: ChartTimeframe
): number[] {
  const seed = hashSeed(`${pair.baseSymbol}-${timeframe}`);
  const count = timeframe === "1d" ? 48 : timeframe === "1h" ? 60 : 72;
  const bars: number[] = [];
  let v = 40 + (seed % 30);
  for (let i = 0; i < count; i++) {
    v += ((seed + i * 17) % 11) - 5;
    bars.push(Math.max(8, Math.min(92, v)));
  }
  return bars;
}
