"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

import { isNewerBlockCursor } from "@/lib/perps/block-cursor";
import type { ApiBigInt } from "@/lib/utils/coerce-bigint";
import { rememberFundingIndexes } from "@/services/perps/market/funding-index-by-id";
import { rememberMarks } from "@/services/perps/market/marks-by-ids";
import type {
  MarketFundingIndex,
  MarketFundingRateRsp,
  MarketMark,
  MarketWsChannel,
} from "@/services/perps/market/types";
import { perpsMarketWs, type MarketWsMessageHandler } from "@/services/perps/market/ws";
import { normalizePairIds } from "@/services/perps/orders/pairs-by-ids";

const ORACLE_CHANNELS = ["mark", "fundingRate", "fundingIndex"] as const satisfies readonly MarketWsChannel[];

export function fundingRateQueryKey(pairId: number) {
  return ["perps", "market", "funding-rate", pairId] as const;
}

function isApiBigInt(value: unknown): value is ApiBigInt {
  return typeof value === "string" || typeof value === "number" || typeof value === "bigint";
}

function isMarkData(data: unknown): data is Omit<MarketMark, "pairId"> {
  if (data == null || typeof data !== "object") return false;
  const row = data as Omit<MarketMark, "pairId">;
  return (
    isApiBigInt(row.markX18) &&
    isApiBigInt(row.timestamp) &&
    isApiBigInt(row.blockNumber) &&
    Number.isInteger(row.blockLogIndex)
  );
}

function isFundingRateData(data: unknown): data is MarketFundingRateRsp {
  if (data == null || typeof data !== "object") return false;
  const row = data as MarketFundingRateRsp;
  return (
    typeof row.positive === "boolean" &&
    isApiBigInt(row.ratePerSecondX18) &&
    isApiBigInt(row.timestamp) &&
    isApiBigInt(row.blockNumber) &&
    Number.isInteger(row.blockLogIndex)
  );
}

function applyMark(pairId: number, data: unknown): void {
  if (!Number.isInteger(pairId) || pairId < 0 || !isMarkData(data)) return;
  rememberMarks([{ pairId, ...data }]);
}

function isFundingIndexData(data: unknown): data is Omit<MarketFundingIndex, "pairId"> {
  if (data == null || typeof data !== "object") return false;
  const row = data as Omit<MarketFundingIndex, "pairId">;
  return (
    isApiBigInt(row.value) &&
    isApiBigInt(row.timestamp) &&
    isApiBigInt(row.blockNumber) &&
    Number.isInteger(row.blockLogIndex)
  );
}

function applyFundingIndex(pairId: number, data: unknown): void {
  if (!Number.isInteger(pairId) || pairId < 0 || !isFundingIndexData(data)) return;
  rememberFundingIndexes([{ pairId, ...data }]);
}

function applyFundingRate(queryClient: QueryClient, pairId: number, data: unknown): void {
  if (!isFundingRateData(data)) return;
  queryClient.setQueryData<MarketFundingRateRsp | null>(fundingRateQueryKey(pairId), (prev) =>
    isNewerBlockCursor(data, prev) ? data : (prev ?? null)
  );
}

/**
 * Subscribe mark, fundingRate, and fundingIndex for each pair.
 * Mark refreshes the mark cache. Funding rate refreshes the toolbar quote.
 * Funding index refreshes the in-memory global index used by open positions.
 */
export function usePerpsOracleWs(pairIds: readonly number[], enabled = true) {
  const queryClient = useQueryClient();
  const idsKey = useMemo(() => normalizePairIds(pairIds).join(","), [pairIds]);
  const ids = useMemo(() => (idsKey ? idsKey.split(",").map(Number) : []), [idsKey]);

  useEffect(() => {
    if (!enabled || ids.length === 0 || !perpsMarketWs.isConfigured()) return;
    const wanted = new Set(ids);

    const onMessage: MarketWsMessageHandler = (msg) => {
      if (!("channel" in msg) || !wanted.has(msg.pairId)) return;
      if (msg.channel === "mark") {
        applyMark(msg.pairId, msg.data);
        return;
      }
      if (msg.channel === "fundingRate") {
        applyFundingRate(queryClient, msg.pairId, msg.data);
        return;
      }
      if (msg.channel === "fundingIndex") applyFundingIndex(msg.pairId, msg.data);
    };

    const offMessage = perpsMarketWs.addHandler(onMessage);
    for (const pairId of ids) {
      for (const channel of ORACLE_CHANNELS) perpsMarketWs.subscribe(channel, pairId);
    }

    return () => {
      offMessage();
      for (const pairId of ids) {
        for (const channel of ORACLE_CHANNELS) perpsMarketWs.unsubscribe(channel, pairId);
      }
    };
  }, [enabled, ids, queryClient]);
}
