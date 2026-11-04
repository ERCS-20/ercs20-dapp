"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { PerpsFavoriteButton } from "@/components/perps/perps-favorite-button";
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
import type { TickerStats } from "@/lib/market/market-ticker-stats";
import { formatFundingQuote } from "@/lib/perps/funding-quote";
import { formatMarkPrice } from "@/lib/perps/mark-price";
import { pairLabelFromCode, pairPathFromCode } from "@/lib/perps/pair-api";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import type { PerpsPair } from "@/lib/perps/types";
import { cn } from "@/lib/utils";
import { useFundingRate, useMarketPairsPagination, useMarksByIds, usePerpsTickerStats } from "@/services/perps/market/hooks";
import { usePerpsOracleWs } from "@/services/perps/market/oracle-ws";
import { useI18n } from "@/providers/i18n-provider";

function SpotBaseIcon({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  const label = symbol.trim() || "TOKEN";

  if (failed) {
    return (
      <span
        className="bg-muted text-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-border/60"
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
      className="size-8 shrink-0 rounded-full ring-1 ring-border/60"
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}

function TickerStat({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="shrink-0 whitespace-nowrap">
      <dt className="text-muted-foreground text-[11px] leading-4">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 text-[13px] leading-5 font-medium tabular-nums tracking-tight",
          muted ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function LastPrice({
  price,
  change,
  amount,
  up,
}: {
  price: string;
  change: string;
  amount: string;
  up: boolean;
}) {
  const tone = up ? "text-brand" : "text-brand-alt";
  return (
    <div className={cn("flex shrink-0 flex-col", tone)}>
      <p className="text-xl leading-none font-semibold tabular-nums tracking-tight">
        {price}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-[11px] leading-none tabular-nums">
        <span>{change}</span>
        <span className="opacity-80">{amount}</span>
      </p>
    </div>
  );
}

function PairSelector({
  pair,
  label,
  onPairChange,
  className,
}: {
  pair: PerpsPair;
  label: string;
  onPairChange: (path: string) => void;
  className?: string;
}) {
  const { data } = useMarketPairsPagination({ currentPage: 1, pageSize: 100 });
  const pairs = data?.pageItems ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label={label}
          className={cn(
            "text-foreground h-9 max-w-full gap-1 rounded-lg px-2 text-sm font-semibold tracking-tight hover:bg-muted/60 sm:text-base",
            className
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDownIcon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
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

function PairHeading({
  pair,
  onPairChange,
  hideSelectorOnWide,
}: {
  pair: PerpsPair;
  onPairChange: (path: string) => void;
  hideSelectorOnWide: boolean;
}) {
  const label = `${pair.baseSymbol}/${pair.quoteSymbol}`;
  return (
    <div className="flex min-w-0 items-center">
      {hideSelectorOnWide ? (
        <span className="text-foreground hidden truncate text-sm font-semibold tracking-tight 2xl:inline sm:text-base">
          {label}
        </span>
      ) : null}
      <PairSelector
        pair={pair}
        label={label}
        onPairChange={onPairChange}
        className={hideSelectorOnWide ? "2xl:hidden" : undefined}
      />
      <PerpsFavoriteButton pairId={pair.pairId} className="size-6" />
    </div>
  );
}

function MarkStat({
  pairId,
  enginePriceDecimal,
  label,
}: {
  pairId: number | undefined;
  enginePriceDecimal: number | undefined;
  label: string;
}) {
  const ids = pairId == null ? [] : [pairId];
  const marks = useMarksByIds(ids, { enabled: pairId != null });
  const mark = pairId == null ? undefined : marks.get(pairId);
  const quote = mark ? formatMarkPrice(mark, enginePriceDecimal) : null;
  return <TickerStat label={label} value={quote?.label ?? "—"} muted={quote == null} />;
}

function FundingStat({ pairId, label }: { pairId: number | undefined; label: string }) {
  const { data } = useFundingRate(pairId);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (data == null) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [data]);

  const value = data == null ? null : formatFundingQuote(data, nowMs);
  return <TickerStat label={label} value={value ?? "—"} muted={value == null} />;
}

function ToolbarStats({
  pair,
  pairId,
  stats,
  enginePriceDecimal,
}: {
  pair: PerpsPair;
  pairId: number | undefined;
  stats: TickerStats;
  enginePriceDecimal: number | undefined;
}) {
  const { t } = useI18n();
  const volumeDigits = { maximumFractionDigits: 2 } as const;
  return (
    <dl className="border-border/60 grid grid-cols-3 gap-x-3 gap-y-2.5 border-t pt-2.5 sm:grid-cols-4 lg:flex lg:min-w-0 lg:flex-1 lg:flex-nowrap lg:items-center lg:justify-between lg:gap-x-3 lg:overflow-x-auto lg:border-t-0 lg:pt-0 scrollbar-none">
      <MarkStat
        pairId={pairId}
        enginePriceDecimal={enginePriceDecimal}
        label={t("perps.mark")}
      />
      <FundingStat pairId={pairId} label={t("perps.fundingRate")} />
      <TickerStat
        label={t("perps.high24h")}
        value={formatSubscriptPrice(stats.high24h, enginePriceDecimal)}
      />
      <TickerStat
        label={t("perps.low24h")}
        value={formatSubscriptPrice(stats.low24h, enginePriceDecimal)}
      />
      <TickerStat
        label={t("perps.vol24hSymbol").replace("{symbol}", pair.baseSymbol)}
        value={stats.volumeBase.toLocaleString("en-US", volumeDigits)}
      />
      <TickerStat
        label={t("perps.vol24hSymbol").replace("{symbol}", pair.quoteSymbol)}
        value={stats.volume24h.toLocaleString("en-US", volumeDigits)}
      />
    </dl>
  );
}

export function PerpsToolbar({
  pair,
  pairId,
  enginePriceDecimal,
  onPairChange,
  hidePairSelectorOnWide = false,
  stats: statsProp,
  statsLoading: statsLoadingProp,
  className,
}: {
  pair: PerpsPair;
  pairId: number | undefined;
  enginePriceDecimal: number | undefined;
  onPairChange: (path: string) => void;
  hidePairSelectorOnWide?: boolean;
  /** When set (e.g. from `PerpsView`), skip an extra ticker subscription. */
  stats?: TickerStats;
  statsLoading?: boolean;
  className?: string;
}) {
  const live = usePerpsTickerStats(pairId, enginePriceDecimal, {
    // Parent passes `stats` from PerpsView — do not run a second live pipeline here.
    enabled: statsProp === undefined,
  });
  const stats = statsProp ?? live.stats;
  const isLoading = statsLoadingProp ?? live.isLoading;

  const up = stats.change24hPct >= 0;
  const changeAmountLabel =
    stats.changeAmount === 0 && isLoading
      ? "…"
      : `${stats.changeAmount >= 0 ? "+" : ""}${formatSubscriptPrice(stats.changeAmount, enginePriceDecimal)}`;

  const priceLabel =
    isLoading && stats.lastPrice === 0
      ? "…"
      : formatSubscriptPrice(stats.lastPrice, enginePriceDecimal);
  usePerpsOracleWs(pairId == null ? [] : [pairId]);

  return (
    <div
      className={cn(
        "border-border/60 bg-card/80 flex min-w-0 flex-col gap-3 rounded-xl border px-3 py-2.5 sm:px-4 lg:flex-row lg:flex-nowrap lg:items-center lg:gap-4",
        className
      )}
    >
      <div className="flex shrink-0 items-center gap-2.5">
        <SpotBaseIcon symbol={pair.baseSymbol} />
        <PairHeading
          pair={pair}
          onPairChange={onPairChange}
          hideSelectorOnWide={hidePairSelectorOnWide}
        />
        <span className="bg-border/80 mx-1 hidden h-8 w-px shrink-0 lg:block" aria-hidden />
        <LastPrice
          price={priceLabel}
          change={formatPercentChange(stats.change24hPct)}
          amount={changeAmountLabel}
          up={up}
        />
      </div>

      <ToolbarStats
        pair={pair}
        pairId={pairId}
        stats={stats}
        enginePriceDecimal={enginePriceDecimal}
      />
    </div>
  );
}
