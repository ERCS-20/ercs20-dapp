import type {
  MarketPairRsp,
  MarketPairsPaginationRsp,
  MarketPairsRsp,
  MarketWsPairPrice,
} from "@/services/spot/market/types";

function priceKey(v: MarketPairRsp["open"]): string {
  return typeof v === "bigint" ? v.toString() : String(v);
}

/** Patch `open`/`close` on matching rows; returns same ref if unchanged. */
export function applyPairPriceUpdates(
  pairs: MarketPairRsp[],
  updates: readonly MarketWsPairPrice[]
): MarketPairRsp[] {
  if (pairs.length === 0 || updates.length === 0) return pairs;

  const byId = new Map<number, MarketWsPairPrice>();
  for (const u of updates) {
    if (typeof u.pairId === "number" && u.open != null && u.close != null) {
      byId.set(u.pairId, u);
    }
  }
  if (byId.size === 0) return pairs;

  let changed = false;
  const next = pairs.map((p) => {
    const u = byId.get(p.pairId);
    if (!u) return p;
    if (priceKey(p.open) === priceKey(u.open) && priceKey(p.close) === priceKey(u.close)) {
      return p;
    }
    changed = true;
    return { ...p, open: u.open, close: u.close };
  });
  return changed ? next : pairs;
}

export function applyPairPricesToPagination(
  data: MarketPairsPaginationRsp | undefined,
  updates: readonly MarketWsPairPrice[]
): MarketPairsPaginationRsp | undefined {
  if (data == null) return data;
  const pageItems = applyPairPriceUpdates(data.pageItems, updates);
  return pageItems === data.pageItems ? data : { ...data, pageItems };
}

export function applyPairPricesToUserPairs(
  data: MarketPairsRsp | undefined,
  updates: readonly MarketWsPairPrice[]
): MarketPairsRsp | undefined {
  if (data == null) return data;
  const pairs = applyPairPriceUpdates(data.pairs, updates);
  return pairs === data.pairs ? data : { ...data, pairs };
}

export function isMarketWsPairPriceList(data: unknown): data is MarketWsPairPrice[] {
  if (!Array.isArray(data)) return false;
  return data.every((item) => {
    if (item == null || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    return (
      typeof row.pairId === "number" && row.open != null && row.close != null
    );
  });
}
