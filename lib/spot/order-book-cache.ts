import type { MarketBidsAndAsks, MarketOrderBookListRsp } from "@/services/spot/market/types";
import { parseApiBigInt } from "@/lib/utils/coerce-bigint";

/** Sorted price levels beyond UI depth; zero qty removes a level. */
export class OrderBookSideCache {
  private readonly levels = new Map<number, bigint>();
  private sortedPrices: number[] = [];
  private sortedDirty = true;

  constructor(private readonly ascending: boolean) {}

  applyLevels(items: MarketBidsAndAsks["bids"] | undefined) {
    if (!items?.length) return;

    for (const row of items) {
      const qty = parseApiBigInt(row.quantity);
      if (qty == null || qty === BigInt(0)) {
        this.levels.delete(row.price);
      } else {
        this.levels.set(row.price, qty);
      }
    }
    this.sortedDirty = true;
  }

  private ensureSorted() {
    if (!this.sortedDirty) return;
    this.sortedPrices = [...this.levels.keys()];
    this.sortedPrices.sort((a, b) => (this.ascending ? a - b : b - a));
    this.sortedDirty = false;
  }

  /** Best `depth` levels (bids: highest first, asks: lowest first). */
  top(depth: number): { price: number; quantity: bigint }[] {
    this.ensureSorted();
    const out: { price: number; quantity: bigint }[] = [];
    for (const price of this.sortedPrices) {
      const quantity = this.levels.get(price);
      if (quantity == null || quantity === BigInt(0)) continue;
      out.push({ price, quantity });
      if (out.length >= depth) break;
    }
    return out;
  }

  clear() {
    this.levels.clear();
    this.sortedPrices = [];
    this.sortedDirty = true;
  }
}

/** Pair-scoped order book store: merge snapshots, show top-N per side. */
export class OrderBookCache {
  readonly bids = new OrderBookSideCache(false);
  readonly asks = new OrderBookSideCache(true);
  private sequence = 0;

  applySnapshot(rsp: MarketOrderBookListRsp): boolean {
    if (rsp.sequence <= this.sequence) return false;

    this.bids.applyLevels(rsp.bidsAndAsks?.bids);
    this.asks.applyLevels(rsp.bidsAndAsks?.asks);
    this.sequence = rsp.sequence;
    return true;
  }

  reset() {
    this.bids.clear();
    this.asks.clear();
    this.sequence = 0;
  }

  /** For future WS deltas: set qty to 0n to drop a level from cache. */
  patchLevel(side: "bid" | "ask", price: number, quantity: bigint) {
    const target = side === "bid" ? this.bids : this.asks;
    if (quantity === BigInt(0)) {
      target.applyLevels([{ price, quantity: "0" }]);
    } else {
      target.applyLevels([{ price, quantity: quantity.toString() }]);
    }
    this.sequence += 1;
  }
}

export const ORDER_BOOK_DISPLAY_DEPTH = 10;
