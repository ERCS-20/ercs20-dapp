"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";

import { SpotFavoriteButton, useSpotFavorites } from "@/components/spot/spot-favorite-button";
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
import { useMarketPairsPagination } from "@/services/spot/market/hooks";
import type { MarketPairRsp } from "@/services/spot/market/types";
import { usePairEnginePriceDecimalMap } from "@/services/spot/orders/hooks";
import { useI18n } from "@/providers/i18n-provider";

const MARKET_PAIR_PAGE_SIZE = 100;

function filterMarketPairs(pairs: MarketPairRsp[], query: string): MarketPairRsp[] {
  const q = query.trim().toLowerCase();
  if (!q) return pairs;
  return pairs.filter((p) => {
    const label = pairLabelFromCode(p.code).toLowerCase();
    return label.includes(q) || p.code.toLowerCase().includes(q);
  });
}

function PairListItems({
  pairs,
  activePair,
  enginePriceDecimalMap,
  emptyMessage,
}: {
  pairs: MarketPairRsp[];
  activePair: SpotPair;
  enginePriceDecimalMap: Map<number, number>;
  emptyMessage: string;
}) {
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

        const parsed = pairLabelFromCode(p.code).split("/");
        const quoteSymbol = parsed[1] ?? activePair.quoteSymbol;
        const active = p.pairId === activePair.pairId;
        const favoriteKey = `pair-${p.pairId}`;

        if (enginePriceDecimal == null) {
          return (
            <li
              key={p.pairId}
              className={cn(
                "flex items-center gap-0.5 rounded-lg px-2 py-2",
                active && "bg-muted/80"
              )}
            >
              <span className="text-foreground truncate text-sm font-medium">
                {pairLabelFromCode(p.code)}
              </span>
              <span className="text-muted-foreground ml-auto text-xs">…</span>
            </li>
          );
        }

        const { lastPrice, change24hPct } = calcOpenCloseChange(
          p.open,
          p.close,
          enginePriceDecimal
        );
        const up = change24hPct >= 0;

        return (
          <li
            key={p.pairId}
            className={cn(
              "flex items-center gap-0.5 rounded-lg",
              active && "bg-muted/80"
            )}
          >
            <SpotFavoriteButton
              pairAddress={favoriteKey}
              className="size-7 shrink-0 rounded-md [&_svg]:size-3.5"
            />
            <Link
              href={`/spot/${pairPathFromCode(p.code)}`}
              className="hover:bg-muted/60 min-w-0 flex-1 rounded-lg py-2 pr-2 pl-0.5 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground truncate text-sm font-medium">
                  {pairLabelFromCode(p.code)}
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
  const [query, setQuery] = useState("");
  const favorites = useSpotFavorites();

  const paginationReq = useMemo(
    () => ({ currentPage: 1, pageSize: MARKET_PAIR_PAGE_SIZE }),
    []
  );

  const { data, isLoading } = useMarketPairsPagination(paginationReq);
  const pairs = data?.pageItems ?? [];
  const enginePriceDecimalMap = usePairEnginePriceDecimalMap(pairs);

  const allFiltered = useMemo(() => filterMarketPairs(pairs, query), [pairs, query]);

  const favoritesFiltered = useMemo(
    () =>
      filterMarketPairs(
        pairs.filter((p) => favorites.has(`pair-${p.pairId}`)),
        query
      ),
    [pairs, query, favorites]
  );

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
            <TabsTrigger value="favorites" className="flex-1 text-xs sm:text-sm">
              {t("spot.favoritesTab")}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 text-xs sm:text-sm">
              {t("spot.allPairsTab")}
            </TabsTrigger>
          </TabsList>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground px-3 py-6 text-center text-xs">{t("swap.loading")}</p>
        ) : (
          <>
            <TabsContent
              value="favorites"
              className="scrollbar-none mt-0 min-h-0 flex-1 overflow-y-auto"
            >
              <PairListItems
                pairs={favoritesFiltered}
                activePair={activePair}
                enginePriceDecimalMap={enginePriceDecimalMap}
                emptyMessage={
                  query.trim() ? t("spot.noPairsFound") : t("spot.emptyFavorites")
                }
              />
            </TabsContent>
            <TabsContent
              value="all"
              className="scrollbar-none mt-0 min-h-0 flex-1 overflow-y-auto"
            >
              <PairListItems
                pairs={allFiltered}
                activePair={activePair}
                enginePriceDecimalMap={enginePriceDecimalMap}
                emptyMessage={t("spot.noPairsFound")}
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </aside>
  );
}
