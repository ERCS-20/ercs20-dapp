"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { SpotFavoriteButton } from "@/components/spot/spot-favorite-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatPercentChange,
  formatSubscriptPrice,
} from "@/lib/utils/price";
import { calcOpenCloseChange, marketKlineToStats } from "@/lib/spot/market-stats";
import { pairLabel, pairLabelFromCode, pairPathFromCode } from "@/lib/spot/pair-api";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import type { SpotPair } from "@/lib/spot/types";
import { cn } from "@/lib/utils";
import { useKlineCurrentDay, useMarketPairsPagination } from "@/services/spot/market/hooks";
import { useI18n } from "@/providers/i18n-provider";

function SpotBaseIcon({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  const label = symbol.trim() || "TOKEN";

  if (failed) {
    return (
      <span
        className="bg-muted text-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-border/60 sm:size-10"
        aria-hidden
      >
        {label.slice(0, 2)}
      </span>
    );
  }

  return (
    <Image
      src={getTokenIconSrc(label)}
      alt=""
      width={40}
      height={40}
      className="size-9 shrink-0 rounded-full ring-1 ring-border/60 sm:size-10"
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}

function PairSelector({
  pair,
  onPairChange,
  className,
  compact = false,
}: {
  pair: SpotPair;
  onPairChange: (path: string) => void;
  className?: string;
  compact?: boolean;
}) {
  const { data } = useMarketPairsPagination({ currentPage: 1, pageSize: 100 });
  const pairs = data?.pageItems ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label={pairLabel(pair)}
          className={cn(
            compact
              ? "text-muted-foreground size-8 shrink-0 rounded-full p-0 hover:bg-muted/60"
              : "text-muted-foreground h-auto gap-0.5 rounded-md px-1 py-0 text-xs font-normal hover:bg-transparent",
            className
          )}
        >
          {compact ? (
            <ChevronDownIcon className="size-4 opacity-70" aria-hidden />
          ) : (
            <>
              <span>{pairLabel(pair)}</span>
              <ChevronDownIcon className="size-3.5 opacity-60" aria-hidden />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuRadioGroup
          value={String(pair.pairId ?? "")}
          onValueChange={(id) => {
            const next = pairs.find((p) => String(p.pairId) === id);
            if (next) onPairChange(pairPathFromCode(next.code));
          }}
        >
          {pairs.map((p) => (
            <DropdownMenuRadioItem key={p.pairId} value={String(p.pairId)}>
              {pairLabelFromCode(p.code)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SpotToolbar({
  pair,
  pairId,
  enginePriceDecimal,
  onPairChange,
  hidePairSelectorOnWide = false,
  className,
}: {
  pair: SpotPair;
  pairId: number | undefined;
  enginePriceDecimal: number | undefined;
  onPairChange: (path: string) => void;
  hidePairSelectorOnWide?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const { data: kline, isLoading } = useKlineCurrentDay(pairId);

  const stats = useMemo(() => {
    if (!kline || enginePriceDecimal == null) {
      return {
        lastPrice: 0,
        change24hPct: 0,
        changeAmount: 0,
        high24h: 0,
        low24h: 0,
        volumeBase: 0,
        volume24h: 0,
      };
    }
    const current = kline.current;
    if (!current) {
      return {
        lastPrice: 0,
        change24hPct: 0,
        changeAmount: 0,
        high24h: 0,
        low24h: 0,
        volumeBase: 0,
        volume24h: 0,
      };
    }

    // High/Low/Volume come from today's D1 bar; 24h change is relative to yesterday close.
    const klineStats = marketKlineToStats(current, enginePriceDecimal);
    const { change24hPct, changeAmount } = calcOpenCloseChange(
      kline.prevClose,
      current.close,
      enginePriceDecimal
    );
    return { ...klineStats, change24hPct, changeAmount };
  }, [kline, enginePriceDecimal]);

  const up = stats.change24hPct >= 0;
  const changeTone = up ? "text-brand" : "text-brand-alt";
  const changeAmountLabel =
    stats.changeAmount === 0 && isLoading
      ? "…"
      : `${stats.changeAmount >= 0 ? "+" : ""}${formatSubscriptPrice(stats.changeAmount, enginePriceDecimal)}`;

  return (
    <div
      className={cn(
        "border-border/60 bg-card/80 flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4",
        "lg:gap-6 lg:py-3",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <SpotBaseIcon symbol={pair.baseSymbol} />

        <div className="min-w-0">
          <p className="text-foreground text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
            {isLoading && stats.lastPrice === 0 ? "…" : formatSubscriptPrice(stats.lastPrice, enginePriceDecimal)}
          </p>
          <div
            className={cn(
              "mt-0.5 flex items-center gap-2 text-xs tabular-nums sm:text-sm",
              changeTone
            )}
          >
            <span>{formatPercentChange(stats.change24hPct)}</span>
            <span>{changeAmountLabel}</span>
          </div>
        </div>

        {hidePairSelectorOnWide ? (
          <PairSelector
            pair={pair}
            onPairChange={onPairChange}
            compact
            className="2xl:hidden"
          />
        ) : (
          <PairSelector pair={pair} onPairChange={onPairChange} compact />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <SpotFavoriteButton pairId={pair.pairId} />
        <dl className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4 sm:gap-x-5 sm:text-sm lg:gap-x-6">
          <div>
            <dt>{t("spot.high24h")}</dt>
            <dd className="text-foreground tabular-nums">{formatSubscriptPrice(stats.high24h, enginePriceDecimal)}</dd>
          </div>
          <div>
            <dt>{t("spot.low24h")}</dt>
            <dd className="text-foreground tabular-nums">{formatSubscriptPrice(stats.low24h, enginePriceDecimal)}</dd>
          </div>
          <div>
            <dt>{t("spot.vol24hSymbol").replace("{symbol}", pair.baseSymbol)}</dt>
            <dd className="text-foreground tabular-nums">
              {stats.volumeBase.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </dd>
          </div>
          <div>
            <dt>{t("spot.vol24hSymbol").replace("{symbol}", pair.quoteSymbol)}</dt>
            <dd className="text-foreground tabular-nums">
              {stats.volume24h.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
