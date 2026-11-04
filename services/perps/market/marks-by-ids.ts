import { isNewerBlockCursor } from "@/lib/perps/block-cursor";
import { apiBigIntToString, type ApiBigInt } from "@/lib/utils/coerce-bigint";
import { listMarks } from "@/services/perps/market/api";
import type { MarketMark } from "@/services/perps/market/types";
import { normalizePairIds } from "@/services/perps/orders/pairs-by-ids";

const LEGACY_STORAGE_KEY = "orbix.perps.marks-by-id.v1";

const byId = new Map<number, MarketMark>();
const listeners = new Set<() => void>();
let droppedLegacy = false;

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

/** Drop the retired localStorage map. Marks live in memory for this page only. */
function dropLegacyStorage(): void {
  if (droppedLegacy || typeof window === "undefined") return;
  droppedLegacy = true;
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Private mode can reject storage. The in-memory map still works.
  }
}

function normalize(mark: MarketMark): MarketMark {
  return {
    pairId: mark.pairId,
    markX18: apiBigIntToString(mark.markX18),
    timestamp: apiBigIntToString(mark.timestamp),
    blockNumber: apiBigIntToString(mark.blockNumber),
    blockLogIndex: mark.blockLogIndex,
  };
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

/** Marks already received this page load. Does not call the API. */
export function peekMarksByIds(pairIds: readonly number[]): MarketMark[] {
  dropLegacyStorage();
  return collect(normalizePairIds(pairIds));
}

/** Keep a mark when its block cursor is newer. Does not write localStorage. */
export function rememberMarks(marks: readonly MarketMark[]): void {
  dropLegacyStorage();
  let changed = false;
  for (const mark of marks) {
    if (!isMarketMark(mark)) continue;
    const next = normalize(mark);
    if (!isNewerBlockCursor(next, byId.get(next.pairId))) continue;
    byId.set(next.pairId, next);
    changed = true;
  }
  if (changed) emit();
}

export function subscribeMarks(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Mark prices by id for this page load.
 * Ids not yet in memory are one `POST /mark/list`. Later `mark` pushes update memory only.
 */
export async function getMarksByIds(pairIds: readonly number[]): Promise<MarketMark[]> {
  dropLegacyStorage();
  const ids = normalizePairIds(pairIds);
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    const rsp = await listMarks(missing);
    rememberMarks(rsp?.marks ?? []);
  }
  return collect(ids);
}
