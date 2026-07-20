import type {
  MarketBidsAndAsks,
  MarketOrderBookListRsp,
  MarketWsOrderBookDiff,
} from "@/services/spot/market/types";
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

  /**
   * Apply a full REST snapshot:
   * - clear previous state
   * - aggregate duplicate price entries by summing quantity
   */
  replaceLevels(items: MarketBidsAndAsks["bids"] | undefined) {
    this.clear();
    if (!items?.length) return;

    for (const row of items) {
      const qty = parseApiBigInt(row.quantity);
      if (qty == null || qty === BigInt(0)) {
        continue;
      }
      const prev = this.levels.get(row.price) ?? BigInt(0);
      this.levels.set(row.price, prev + qty);
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
  /** Start below 0 so the first REST snapshot with sequence 0 is accepted. */
  private sequence = -1;

  getSequence(): number {
    return this.sequence;
  }

  /** REST full snapshot — always authoritative. */
  applySnapshot(rsp: MarketOrderBookListRsp): void {
    this.bids.replaceLevels(rsp.bidsAndAsks?.bids);
    this.asks.replaceLevels(rsp.bidsAndAsks?.asks);
    this.sequence = rsp.sequence;
  }

  /**
   * WS orderbook diff: absolute qty per price; `0` deletes the level.
   * Applies only when `sequence >` current (gaps allowed).
   */
  applyDiff(sequence: number, diff: MarketWsOrderBookDiff): boolean {
    if (sequence <= this.sequence) return false;
    this.bids.applyLevels(diff.bids);
    this.asks.applyLevels(diff.asks);
    this.sequence = sequence;
    return true;
  }

  reset() {
    this.bids.clear();
    this.asks.clear();
    this.sequence = -1;
  }
}

export const ORDER_BOOK_DISPLAY_DEPTH = 10;
