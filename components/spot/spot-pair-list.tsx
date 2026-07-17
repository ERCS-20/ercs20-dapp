"use client";

import Link from "next/link";
import { useMemo, useState, type DragEvent } from "react";
import { GripVerticalIcon, SearchIcon } from "lucide-react";

import { SpotFavoriteButton } from "@/components/spot/spot-favorite-button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calcOpenCloseChange } from "@/lib/spot/market-stats";
import { formatPercentChange, formatSubscriptPrice } from "@/lib/utils/price";
import {
  pairLabelFromCode,
  pairPathFromCode,
} from "@/lib/spot/pair-api";
import type { SpotPair } from "@/lib/spot/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import {
  useMarketPairsPagination,
  useMarketUserPairs,
} from "@/services/spot/market/hooks";
import type { MarketPairRsp } from "@/services/spot/market/types";
import { usePairEnginePriceDecimalMap } from "@/services/spot/orders/hooks";
import {
  useReorderUserPairs,
  useUserPairs,
} from "@/services/spot/user/hooks";

const MARKET_PAIR_PAGE_SIZE = 100;

function filterMarketPairs(pairs: MarketPairRsp[], query: string): MarketPairRsp[] {
  const q = query.trim().toLowerCase();
  if (!q) return pairs;
  return pairs.filter((p) => {
    const label = pairLabelFromCode(p.code).toLowerCase();
    return label.includes(q) || p.code.toLowerCase().includes(q);
  });
}

function PairRow({
  pair,
  activePair,
  enginePriceDecimal,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  pair: MarketPairRsp;
  activePair: SpotPair;
  enginePriceDecimal: number | undefined;
  draggable?: boolean;
  onDragStart?: (e: DragEvent<HTMLLIElement>) => void;
  onDragOver?: (e: DragEvent<HTMLLIElement>) => void;
  onDrop?: (e: DragEvent<HTMLLIElement>) => void;
  onDragEnd?: (e: DragEvent<HTMLLIElement>) => void;
}) {
  const parsed = pairLabelFromCode(pair.code).split("/");
  const quoteSymbol = parsed[1] ?? activePair.quoteSymbol;
  const active = pair.pairId === activePair.pairId;

  if (enginePriceDecimal == null) {
    return (
      <li
        className={cn(
          "flex items-center gap-0.5 rounded-lg px-2 py-2",
          active && "bg-muted/80"
        )}
      >
        {draggable ? (
          <span className="text-muted-foreground/50 flex size-7 shrink-0 items-center justify-center">
            <GripVerticalIcon className="size-3.5" aria-hidden />
          </span>
        ) : null}
        <span className="text-foreground truncate text-sm font-medium">
          {pairLabelFromCode(pair.code)}
        </span>
        <span className="text-muted-foreground ml-auto text-xs">…</span>
      </li>
    );
  }

  const { lastPrice, change24hPct } = calcOpenCloseChange(
    pair.open,
    pair.close,
    enginePriceDecimal
  );
  const up = change24hPct >= 0;

  return (
    <li
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-0.5 rounded-lg",
        active && "bg-muted/80",
        draggable && "cursor-grab active:cursor-grabbing"
      )}
    >
      {draggable ? (
        <span
          className="text-muted-foreground hover:text-foreground flex size-7 shrink-0 items-center justify-center"
          aria-hidden
        >
          <GripVerticalIcon className="size-3.5" />
        </span>
      ) : null}
      <SpotFavoriteButton
        pairId={pair.pairId}
        className="size-7 shrink-0 rounded-md [&_svg]:size-3.5"
      />
      <Link
        href={`/spot/${pairPathFromCode(pair.code)}`}
        className="hover:bg-muted/60 min-w-0 flex-1 rounded-lg py-2 pr-2 pl-0.5 transition-colors"
        draggable={false}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-foreground truncate text-sm font-medium">
            {pairLabelFromCode(pair.code)}
          </span>
          <span
            className={cn(
              "shrink-0 text-xs tabular-nums",
              up ? "text-brand" : "text-brand-alt"
            )}
          >
            {formatPercentChange(change24hPct)}
          </span>
        </div>
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatSubscriptPrice(lastPrice, enginePriceDecimal)} {quoteSymbol}
        </span>
      </Link>
    </li>
  );
}

function PairListItems({
  pairs,
  activePair,
  enginePriceDecimalMap,
  emptyMessage,
  reorderable,
  onReorder,
}: {
  pairs: MarketPairRsp[];
  activePair: SpotPair;
  enginePriceDecimalMap: Map<number, number>;
  emptyMessage: string;
  reorderable?: boolean;
  onReorder?: (fromPairId: number, toPairId: number) => void;
}) {
  const [draggingPairId, setDraggingPairId] = useState<number | null>(null);

  if (pairs.length === 0) {
    return (
      <p className="text-muted-foreground px-2 py-6 text-center text-xs">{emptyMessage}</p>
    );
  }

  return (
    <ul className="p-1.5">
      {pairs.map((p) => {
        const enginePriceDecimal =
          enginePriceDecimalMap.get(p.pairId) ??
          (p.pairId === activePair.pairId ? activePair.enginePriceDecimal : undefined);

        return (
          <PairRow
            key={p.pairId}
            pair={p}
            activePair={activePair}
            enginePriceDecimal={enginePriceDecimal}
            draggable={reorderable}
            onDragStart={(e) => {
              setDraggingPairId(p.pairId);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", String(p.pairId));
            }}
            onDragOver={(e) => {
              if (!reorderable || draggingPairId == null) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const fromId = Number(e.dataTransfer.getData("text/plain"));
              if (!Number.isFinite(fromId) || fromId === p.pairId) return;
              onReorder?.(fromId, p.pairId);
              setDraggingPairId(null);
            }}
            onDragEnd={() => setDraggingPairId(null)}
          />
        );
      })}
    </ul>
  );
}

export function SpotPairList({
  activePair,
  className,
}: {
  activePair: SpotPair;
  className?: string;
}) {
  const { t } = useI18n();
  const { isAuthenticated, openLoginDialog } = useAuth();
  const [query, setQuery] = useState("");
  const { mutateAsync: reorderPairs } = useReorderUserPairs();

  const paginationReq = useMemo(
    () => ({ currentPage: 1, pageSize: MARKET_PAIR_PAGE_SIZE }),
    []
  );

  const { data: allPairsData, isLoading: isAllLoading } =
    useMarketPairsPagination(paginationReq);
  const allPairs = allPairsData?.pageItems ?? [];

  const { data: userPairsData, isLoading: isUserPairsLoading } = useUserPairs({
    enabled: isAuthenticated,
    notifyError: false,
  });

  const favoritePairIds = useMemo(() => {
    const rows = userPairsData?.pairs ?? [];
    return [...rows]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => p.pairId);
  }, [userPairsData?.pairs]);

  const { data: favoriteMarketData, isLoading: isFavoriteMarketLoading } =
    useMarketUserPairs(favoritePairIds, {
      enabled: isAuthenticated && favoritePairIds.length > 0,
      notifyError: false,
    });

  const favoritePairs = useMemo(() => {
    const byId = new Map(
      (favoriteMarketData?.pairs ?? []).map((p) => [p.pairId, p] as const)
    );
    return favoritePairIds
      .map((id) => byId.get(id))
      .filter((p): p is MarketPairRsp => p != null);
  }, [favoriteMarketData?.pairs, favoritePairIds]);

  const enginePriceDecimalMap = usePairEnginePriceDecimalMap([
    ...allPairs,
    ...favoritePairs,
  ]);

  const allFiltered = useMemo(
    () => filterMarketPairs(allPairs, query),
    [allPairs, query]
  );

  const favoritesFiltered = useMemo(
    () => filterMarketPairs(favoritePairs, query),
    [favoritePairs, query]
  );

  async function handleReorder(fromPairId: number, toPairId: number) {
    const fromIndex = favoritePairIds.indexOf(fromPairId);
    const toIndex = favoritePairIds.indexOf(toPairId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

    const next = [...favoritePairIds];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    await reorderPairs({ pairIds: next });
  }

  const favoritesLoading =
    isAuthenticated &&
    (isUserPairsLoading || (favoritePairIds.length > 0 && isFavoriteMarketLoading));

  return (
    <aside
      className={cn(
        "border-border/60 bg-card flex w-56 shrink-0 flex-col overflow-hidden rounded-xl border",
        className
      )}
      aria-label={t("spot.pairList")}
    >
      <Tabs defaultValue="all" className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="border-border/60 shrink-0 space-y-2 border-b px-3 py-2">
          <div className="relative">
            <SearchIcon
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("spot.searchPairs")}
              className="h-9 rounded-lg pl-8 text-sm"
            />
          </div>
          <TabsList variant="line" className="h-8 w-full">
            <TabsTrigger
              value="favorites"
              className="flex-1 text-xs sm:text-sm"
              onClick={() => {
                if (!isAuthenticated) openLoginDialog();
              }}
            >
              {t("spot.favoritesTab")}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 text-xs sm:text-sm">
              {t("spot.allPairsTab")}
            </TabsTrigger>
          </TabsList>
        </div>

        {isAllLoading && !isAuthenticated ? (
          <p className="text-muted-foreground px-3 py-6 text-center text-xs">
            {t("swap.loading")}
          </p>
        ) : (
          <>
            <TabsContent
              value="favorites"
              className="scrollbar-none mt-0 min-h-0 flex-1 overflow-y-auto"
            >
              {!isAuthenticated ? (
                <p className="text-muted-foreground px-2 py-6 text-center text-xs">
                  {t("spot.loginToFavorite")}
                </p>
              ) : favoritesLoading ? (
                <p className="text-muted-foreground px-3 py-6 text-center text-xs">
                  {t("swap.loading")}
                </p>
              ) : (
                <PairListItems
                  pairs={favoritesFiltered}
                  activePair={activePair}
                  enginePriceDecimalMap={enginePriceDecimalMap}
                  emptyMessage={
                    query.trim() ? t("spot.noPairsFound") : t("spot.emptyFavorites")
                  }
                  reorderable={!query.trim()}
                  onReorder={(fromId, toId) => {
                    void handleReorder(fromId, toId);
                  }}
                />
              )}
            </TabsContent>
            <TabsContent
              value="all"
              className="scrollbar-none mt-0 min-h-0 flex-1 overflow-y-auto"
            >
              {isAllLoading ? (
                <p className="text-muted-foreground px-3 py-6 text-center text-xs">
                  {t("swap.loading")}
                </p>
              ) : (
                <PairListItems
                  pairs={allFiltered}
                  activePair={activePair}
                  enginePriceDecimalMap={enginePriceDecimalMap}
                  emptyMessage={t("spot.noPairsFound")}
                />
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </aside>
  );
}
