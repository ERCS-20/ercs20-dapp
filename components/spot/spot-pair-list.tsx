"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";

import { SpotFavoriteButton, useSpotFavorites } from "@/components/spot/spot-favorite-button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSpotPct, formatSpotPrice } from "@/lib/spot/format";
import {
  getMockMarketStats,
  pairLabel,
  pairPath,
} from "@/lib/spot/mock-market";
import type { SpotPair } from "@/lib/spot/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

function filterPairs(pairs: SpotPair[], query: string): SpotPair[] {
  const q = query.trim().toLowerCase();
  if (!q) return pairs;
  return pairs.filter(
    (p) =>
      p.baseSymbol.toLowerCase().includes(q) ||
      p.baseName.toLowerCase().includes(q) ||
      p.pairCode.toLowerCase().includes(q)
  );
}

function PairListItems({
  pairs,
  activePair,
  emptyMessage,
}: {
  pairs: SpotPair[];
  activePair: SpotPair;
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
        const stats = getMockMarketStats(p);
        const active = p.baseAddress === activePair.baseAddress;
        const up = stats.change24hPct >= 0;

        return (
          <li
            key={p.baseAddress}
            className={cn(
              "flex items-center gap-0.5 rounded-lg",
              active && "bg-muted/80"
            )}
          >
            <SpotFavoriteButton
              pairAddress={p.baseAddress}
              className="size-7 shrink-0 rounded-md [&_svg]:size-3.5"
            />
            <Link
              href={`/spot/${pairPath(p)}`}
              className="hover:bg-muted/60 min-w-0 flex-1 rounded-lg py-2 pr-2 pl-0.5 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground truncate text-sm font-medium">
                  {pairLabel(p)}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs tabular-nums",
                    up ? "text-brand" : "text-brand-alt"
                  )}
                >
                  {formatSpotPct(stats.change24hPct)}
                </span>
              </div>
              <span className="text-muted-foreground text-xs tabular-nums">
                {formatSpotPrice(stats.lastPrice)} {p.quoteSymbol}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function SpotPairList({
  pairs,
  activePair,
  className,
}: {
  pairs: SpotPair[];
  activePair: SpotPair;
  className?: string;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const favorites = useSpotFavorites();

  const allFiltered = useMemo(() => filterPairs(pairs, query), [pairs, query]);

  const favoritesFiltered = useMemo(
    () =>
      filterPairs(
        pairs.filter((p) => favorites.has(p.baseAddress.toLowerCase())),
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

        <TabsContent
          value="favorites"
          className="scrollbar-none mt-0 min-h-0 flex-1 overflow-y-auto"
        >
          <PairListItems
            pairs={favoritesFiltered}
            activePair={activePair}
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
            emptyMessage={t("spot.noPairsFound")}
          />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
