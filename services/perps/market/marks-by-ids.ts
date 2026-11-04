import {
  loadPerpsMarksByIdStorage,
  savePerpsMarksByIdStorage,
} from "@/lib/storage/local-storage";
import { isNewerBlockCursor } from "@/lib/perps/block-cursor";
import { apiBigIntToString, type ApiBigInt } from "@/lib/utils/coerce-bigint";
import { listMarks } from "@/services/perps/market/api";
import type { MarketMark } from "@/services/perps/market/types";
import { normalizePairIds } from "@/services/perps/orders/pairs-by-ids";

const byId = new Map<number, MarketMark>();
const listeners = new Set<() => void>();
let loaded = false;

function isApiBigInt(value: unknown): value is ApiBigInt {
  return typeof value === "string" || typeof value === "number" || typeof value === "bigint";
}

function isMarketMark(value: unknown): value is MarketMark {
  if (value == null || typeof value !== "object") return false;
  const row = value as MarketMark;
  return (
    Number.isInteger(row.pairId) &&
    row.pairId >= 0 &&
    isApiBigInt(row.markX18) &&
    isApiBigInt(row.timestamp) &&
    isApiBigInt(row.blockNumber) &&
    Number.isInteger(row.blockLogIndex)
  );
}

function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;
  for (const value of Object.values(loadPerpsMarksByIdStorage())) {
    if (!isMarketMark(value)) continue;
    byId.set(value.pairId, value);
  }
}

function storableMark(mark: MarketMark): MarketMark {
  return {
    pairId: mark.pairId,
    markX18: apiBigIntToString(mark.markX18),
    timestamp: apiBigIntToString(mark.timestamp),
    blockNumber: apiBigIntToString(mark.blockNumber),
    blockLogIndex: mark.blockLogIndex,
  };
}

function absorbStored(): void {
  for (const value of Object.values(loadPerpsMarksByIdStorage())) {
    if (!isMarketMark(value) || byId.has(value.pairId)) continue;
    byId.set(value.pairId, value);
  }
}

function persist(): void {
  const payload: Record<string, MarketMark> = {};
  for (const [id, mark] of byId) payload[String(id)] = mark;
  try {
    savePerpsMarksByIdStorage(payload);
  } catch {
    // In-memory map still serves this session if storage rejects the payload.
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function collect(ids: readonly number[]): MarketMark[] {
  const rows: MarketMark[] = [];
  for (const id of ids) {
    const mark = byId.get(id);
    if (mark) rows.push(mark);
  }
  return rows;
}

/** Marks already in the localStorage-backed map. Does not call the API. */
export function peekMarksByIds(pairIds: readonly number[]): MarketMark[] {
  ensureLoaded();
  return collect(normalizePairIds(pairIds));
}

/**
 * Replace cached marks when the incoming sample is newer.
 * WebSocket mark pushes should call this so open position views pick up the latest price.
 */
export function rememberMarks(marks: readonly MarketMark[]): void {
  ensureLoaded();
  absorbStored();
  let changed = false;
  for (const mark of marks) {
    if (!isMarketMark(mark)) continue;
    const stored = storableMark(mark);
    if (!isNewerBlockCursor(stored, byId.get(stored.pairId))) continue;
    byId.set(stored.pairId, stored);
    changed = true;
  }
  if (!changed) return;
  persist();
  emit();
}

export function subscribeMarks(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Mark prices by id. Hits come from localStorage and are not requested again.
 * Misses are one `POST /mark/list`, then merged into that cache.
 */
export async function getMarksByIds(pairIds: readonly number[]): Promise<MarketMark[]> {
  const ids = normalizePairIds(pairIds);
  ensureLoaded();
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    const rsp = await listMarks(missing);
    rememberMarks(rsp?.marks ?? []);
  }
  return collect(ids);
}
