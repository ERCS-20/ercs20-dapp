import {
  loadPerpsPairsByIdStorage,
  savePerpsPairsByIdStorage,
} from "@/lib/storage/local-storage";
import { apiBigIntToString, type ApiBigInt } from "@/lib/utils/coerce-bigint";
import { listPairsByIds } from "@/services/perps/orders/api";
import type { PairRsp } from "@/services/perps/orders/types";

const byId = new Map<number, PairRsp>();
let loaded = false;

/** Stable, de-duplicated pair ids (`0` is valid). */
export function normalizePairIds(pairIds: readonly number[]): number[] {
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const id of pairIds) {
    if (!Number.isInteger(id) || id < 0 || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  ids.sort((a, b) => a - b);
  return ids;
}

function isPairRsp(value: unknown): value is PairRsp {
  if (value == null || typeof value !== "object") return false;
  const row = value as PairRsp;
  return (
    Number.isInteger(row.id) &&
    row.id >= 0 &&
    typeof row.pairCode === "string" &&
    row.pairCode.length > 0 &&
    typeof row.enginePriceDecimal === "number" &&
    Number.isFinite(row.enginePriceDecimal)
  );
}

function ensureLoaded(): void {
  if (loaded) return;
  loaded = true;
  for (const value of Object.values(loadPerpsPairsByIdStorage())) {
    if (!isPairRsp(value)) continue;
    byId.set(value.id, value);
  }
}

function asStoredBigInt(value: ApiBigInt | null | undefined): ApiBigInt {
  if (value == null) return "0";
  return apiBigIntToString(value);
}

function storablePair(pair: PairRsp): PairRsp {
  return {
    ...pair,
    blockNumber: asStoredBigInt(pair.blockNumber),
    minTradeAmount: asStoredBigInt(pair.minTradeAmount),
    issuePrice: asStoredBigInt(pair.issuePrice),
    adlEquityThreshold: asStoredBigInt(pair.adlEquityThreshold),
    minCollateralX18: asStoredBigInt(pair.minCollateralX18),
  };
}

function absorbStored(): void {
  for (const value of Object.values(loadPerpsPairsByIdStorage())) {
    if (!isPairRsp(value) || byId.has(value.id)) continue;
    byId.set(value.id, value);
  }
}

function remember(pairs: readonly PairRsp[]): void {
  absorbStored();
  let changed = false;
  for (const pair of pairs) {
    if (!isPairRsp(pair)) continue;
    byId.set(pair.id, storablePair(pair));
    changed = true;
  }
  if (!changed) return;
  const payload: Record<string, PairRsp> = {};
  for (const [id, pair] of byId) payload[String(id)] = pair;
  try {
    savePerpsPairsByIdStorage(payload);
  } catch {
    // In-memory map still serves this session if storage rejects the payload.
  }
}

function collect(ids: readonly number[]): PairRsp[] {
  const rows: PairRsp[] = [];
  for (const id of ids) {
    const pair = byId.get(id);
    if (pair) rows.push(pair);
  }
  return rows;
}

/** Pairs already in the localStorage-backed map. Does not call the API. */
export function peekPairsByIds(pairIds: readonly number[]): PairRsp[] {
  ensureLoaded();
  return collect(normalizePairIds(pairIds));
}

/**
 * Pair metadata by id. Hits come from localStorage; misses are one
 * `POST /pairs/ids`, then merged back into that cache.
 */
export async function getPairsByIds(pairIds: readonly number[]): Promise<PairRsp[]> {
  const ids = normalizePairIds(pairIds);
  ensureLoaded();
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    const rsp = await listPairsByIds({ pairIds: missing });
    remember(rsp.pairs ?? []);
  }
  return collect(ids);
}
