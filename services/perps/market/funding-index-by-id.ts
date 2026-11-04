import { isNewerBlockCursor } from "@/lib/perps/block-cursor";
import { apiBigIntToString, type ApiBigInt } from "@/lib/utils/coerce-bigint";
import type { MarketFundingIndex } from "@/services/perps/market/types";
import { normalizePairIds } from "@/services/perps/orders/pairs-by-ids";

const byId = new Map<number, MarketFundingIndex>();
const listeners = new Set<() => void>();

function isApiBigInt(value: unknown): value is ApiBigInt {
  return typeof value === "string" || typeof value === "number" || typeof value === "bigint";
}

function isFundingIndex(value: unknown): value is MarketFundingIndex {
  if (value == null || typeof value !== "object") return false;
  const row = value as MarketFundingIndex;
  return (
    Number.isInteger(row.pairId) &&
    row.pairId >= 0 &&
    isApiBigInt(row.value) &&
    isApiBigInt(row.timestamp) &&
    isApiBigInt(row.blockNumber) &&
    Number.isInteger(row.blockLogIndex)
  );
}

function storable(index: MarketFundingIndex): MarketFundingIndex {
  return {
    pairId: index.pairId,
    value: apiBigIntToString(index.value),
    timestamp: apiBigIntToString(index.timestamp),
    blockNumber: apiBigIntToString(index.blockNumber),
    blockLogIndex: index.blockLogIndex,
  };
}

function emit(): void {
  for (const listener of listeners) listener();
}

function collect(ids: readonly number[]): MarketFundingIndex[] {
  const rows: MarketFundingIndex[] = [];
  for (const id of ids) {
    const index = byId.get(id);
    if (index) rows.push(index);
  }
  return rows;
}

/** Newest funding index already received for these pairs. Does not call the API. */
export function peekFundingIndexes(pairIds: readonly number[]): MarketFundingIndex[] {
  return collect(normalizePairIds(pairIds));
}

/** Keep a WebSocket funding-index sample when its block cursor is newer. */
export function rememberFundingIndexes(indexes: readonly MarketFundingIndex[]): void {
  let changed = false;
  for (const index of indexes) {
    if (!isFundingIndex(index)) continue;
    const stored = storable(index);
    if (!isNewerBlockCursor(stored, byId.get(stored.pairId))) continue;
    byId.set(stored.pairId, stored);
    changed = true;
  }
  if (changed) emit();
}

export function subscribeFundingIndexes(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
