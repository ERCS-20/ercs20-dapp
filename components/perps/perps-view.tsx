"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { PerpsOrdersTabs, type PerpsOrdersTab } from "@/components/perps/perps-orders-tabs";
import { PerpsChartPanel } from "@/components/perps/perps-chart-panel";
import { PerpsMarketTrades } from "@/components/perps/perps-market-trades";
import { PerpsOrderBook } from "@/components/perps/perps-order-book";
import { PerpsOrderForm } from "@/components/perps/perps-order-form";
import { PerpsPairList } from "@/components/perps/perps-pair-list";
import { PerpsToolbar } from "@/components/perps/perps-toolbar";
import { PerpsTradePanel } from "@/components/perps/perps-trade-panel";
import { getPerpsDefaultPairPath } from "@/lib/config/perps-default-pair";
import { isSwapEnvConfigured } from "@/lib/config/swap-target";
import { readCachedChartView, writeCachedChartView } from "@/lib/perps/cached-chart-view";
import {
  DEFAULT_CHART_VIEW,
  type ChartView,
} from "@/lib/market/chart-interval";
import { pairRspToPerpsPair } from "@/lib/perps/pair-api";
import type { PerpsPair, PerpsSide } from "@/lib/perps/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";
import { usePerpsTickerStats } from "@/services/perps/market/hooks";
import { usePairByCode } from "@/services/perps/orders/hooks";

type MobilePanel = "chart" | "book" | "trade" | "orders";

function placeholderPairFromUrl(token0: string, token1: string): PerpsPair {
  const base = token0.toUpperCase();
  const quote = token1.toUpperCase();
  return {
    baseSymbol: base,
    baseName: base,
    baseAddress: "0x0000000000000000000000000000000000000000",
    quoteSymbol: quote,
    quoteAddress: "0x0000000000000000000000000000000000000000",
    pairCode: `${base}/${quote}`,
  };
}

export function PerpsView({
  token0,
  token1,
}: {
  token0: string;
  token1: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const configured = isSwapEnvConfigured();

  const defaultPath = getPerpsDefaultPairPath();
  const currentPath = `${token0.toLowerCase()}/${token1.toLowerCase()}`;

  const {
    data: pairRsp,
    isError: pairError,
    isFetched: pairFetched,
    isLoading: pairLoading,
  } = usePairByCode(token0, token1);

  useEffect(() => {
    if (!pairFetched) return;
    if (pairError || !pairRsp) {
      if (currentPath !== defaultPath) {
        router.replace(`/perps/${defaultPath}`);
      }
    }
  }, [pairFetched, pairError, pairRsp, currentPath, defaultPath, router]);

  const pair = useMemo(
    () => (pairRsp ? pairRspToPerpsPair(pairRsp) : placeholderPairFromUrl(token0, token1)),
    [pairRsp, token0, token1]
  );

  const pairId = pairRsp?.id;
  const enginePriceDecimal = pairRsp?.enginePriceDecimal;
  const pairReady = Boolean(pairRsp);

  const { stats: marketStats, isLoading: tickerLoading } = usePerpsTickerStats(
    pairId,
    enginePriceDecimal,
    { enabled: pairId != null }
  );

  /** SSR/hydration-safe default; restore from localStorage before paint. */
  const [chartView, setChartView] = useState<ChartView>(DEFAULT_CHART_VIEW);
  const [side, setSide] = useState<PerpsSide>("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  useLayoutEffect(() => {
    setChartView(readCachedChartView());
  }, []);

  const handleChartViewChange = useCallback((view: ChartView) => {
    setChartView(view);
    writeCachedChartView(view);
  }, []);

  useEffect(() => {
    setPrice("");
    setQuantity("");
  }, [pair.baseAddress]);

  const [ordersTab, setOrdersTab] = useState<PerpsOrdersTab>("open");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("chart");

  const handlePairChange = useCallback(
    (path: string) => {
      router.push(`/perps/${path}`);
    },
    [router]
  );

  const handleLevelClick = useCallback((p: number, size: number) => {
    setPrice(String(p));
    setQuantity(String(Math.round(size * 100) / 100));
  }, []);

  const handleOrderPlaced = useCallback(() => {
    setQuantity("");
    setOrdersTab("open");
    setMobilePanel("orders");
  }, []);

  const mobileTabs: { id: MobilePanel; label: string }[] = [
    { id: "chart", label: t("perps.mobileChart") },
    { id: "book", label: t("perps.mobileBook") },
    { id: "trade", label: t("perps.mobileTrade") },
    { id: "orders", label: t("perps.mobileOrders") },
  ];

  if (!configured) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg py-16 text-center">
          <p className="text-muted-foreground text-sm">{t("perps.envNotConfigured")}</p>
        </div>
      </PageShell>
    );
  }

  if (pairLoading || (!pairReady && currentPath !== defaultPath)) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg py-16 text-center">
          <p className="text-muted-foreground text-sm">{t("swap.loading")}</p>
        </div>
      </PageShell>
    );
  }

  if (!pairReady && currentPath === defaultPath) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg py-16 text-center">
          <p className="text-muted-foreground text-sm">{t("perps.pairNotFound")}</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Mobile toolbar */}
      <PerpsToolbar
        pair={pair}
        pairId={pairId}
        enginePriceDecimal={enginePriceDecimal}
        onPairChange={handlePairChange}
        stats={marketStats}
        statsLoading={tickerLoading}
        className="lg:hidden"
      />

      <div className="mt-2 flex gap-1 overflow-x-auto px-0.5 lg:hidden">
        {mobileTabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMobilePanel(id)}
            className={cn(
              "relative shrink-0 px-3 py-2 text-sm font-medium",
              mobilePanel === id ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {label}
            {mobilePanel === id && (
              <span className="bg-primary absolute inset-x-2 -bottom-px h-0.5 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Desktop layout: left (pair list + chart + records) | right trade panel */}
      <div className="mt-2 hidden min-h-0 flex-col gap-1 lg:mt-0 lg:flex lg:h-[calc(100svh-3.5rem)]">
        <div className="flex min-h-0 flex-1 gap-1">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1">
            <div className="flex min-h-0 flex-[7] gap-1">
              <PerpsPairList
                activePair={pair}
                className="hidden h-full min-h-0 rounded-none 2xl:flex"
              />
              <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1">
                <PerpsToolbar
                  pair={pair}
                  pairId={pairId}
                  enginePriceDecimal={enginePriceDecimal}
                  onPairChange={handlePairChange}
                  hidePairSelectorOnWide
                  stats={marketStats}
                  statsLoading={tickerLoading}
                  className="shrink-0 rounded-none border-x-0 border-t-0"
                />
                <PerpsChartPanel
                  pairId={pairId}
                  enginePriceDecimal={enginePriceDecimal}
                  baseSymbol={pair.baseSymbol}
                  quoteSymbol={pair.quoteSymbol}
                  view={chartView}
                  onViewChange={handleChartViewChange}
                  className="min-h-0 flex-1 rounded-none"
                />
              </div>
            </div>
            <PerpsOrdersTabs
              tab={ordersTab}
              onTabChange={setOrdersTab}
              className="min-h-0 flex-[3] rounded-none"
            />
          </div>
          <PerpsTradePanel
            pair={pair}
            pairId={pairId}
            enginePriceDecimal={enginePriceDecimal}
            side={side}
            price={price}
            quantity={quantity}
            lastPrice={marketStats.lastPrice}
            change24hPct={marketStats.change24hPct}
            onSideChange={setSide}
            onPriceChange={setPrice}
            onQuantityChange={setQuantity}
            onLevelClick={handleLevelClick}
            onOrderPlaced={handleOrderPlaced}
            className="h-full min-h-0 w-[min(820px,32%)] shrink-0 [&_section]:rounded-none"
          />
        </div>
      </div>

      {/* Mobile panels */}
      <div className="mt-2 space-y-3 lg:hidden">
        {mobilePanel === "chart" && (
          <PerpsChartPanel
            pairId={pairId}
            enginePriceDecimal={enginePriceDecimal}
            baseSymbol={pair.baseSymbol}
            quoteSymbol={pair.quoteSymbol}
            view={chartView}
            onViewChange={handleChartViewChange}
          />
        )}
        {mobilePanel === "book" && (
          <div className="space-y-3">
            <PerpsOrderBook
              pairId={pairId}
              enginePriceDecimal={enginePriceDecimal}
              quoteSymbol={pair.quoteSymbol}
              lastPrice={marketStats.lastPrice}
              change24hPct={marketStats.change24hPct}
              onLevelClick={(p, s) => {
                handleLevelClick(p, s);
                setMobilePanel("trade");
              }}
              className="min-h-[320px]"
            />
            <PerpsMarketTrades
              pairId={pairId}
              enginePriceDecimal={enginePriceDecimal}
              pair={pair}
              className="h-[240px] max-h-[40vh] shrink-0"
            />
          </div>
        )}
        {mobilePanel === "trade" && (
          <PerpsOrderForm
            pair={pair}
            side={side}
            price={price}
            quantity={quantity}
            lastPrice={marketStats.lastPrice}
            onSideChange={setSide}
            onPriceChange={setPrice}
            onQuantityChange={setQuantity}
            onOrderPlaced={handleOrderPlaced}
          />
        )}
        {mobilePanel === "orders" && (
          <PerpsOrdersTabs tab={ordersTab} onTabChange={setOrdersTab} />
        )}
      </div>
    </PageShell>
  );
}
