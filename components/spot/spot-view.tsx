"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBalance, useChainId, useReadContract } from "wagmi";

import { PageShell } from "@/components/layout/page-shell";
import { SpotOrdersTabs, type SpotOrdersTab } from "@/components/spot/spot-orders-tabs";
import { SpotChartPanel } from "@/components/spot/spot-chart-panel";
import { SpotMarketTrades } from "@/components/spot/spot-market-trades";
import { SpotOrderBook } from "@/components/spot/spot-order-book";
import { SpotOrderForm } from "@/components/spot/spot-order-form";
import { SpotPairList } from "@/components/spot/spot-pair-list";
import { SpotToolbar } from "@/components/spot/spot-toolbar";
import { SpotTradePanel } from "@/components/spot/spot-trade-panel";
import { erc20Abi } from "@/lib/contracts/abis";
import { getSpotDefaultPairPath } from "@/lib/config/spot-default-pair";
import { getSwapTargetChainId, isSwapEnvConfigured } from "@/lib/config/swap-target";
import { marketKlineToStats } from "@/lib/spot/market-stats";
import { pairRspToSpotPair } from "@/lib/spot/pair-api";
import type {
  ChartTimeframe,
  SpotOrder,
  SpotPair,
  SpotSide,
} from "@/lib/spot/types";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useWallet } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";
import { formatBalanceDisplay } from "@/lib/spot/format-balance";
import { useKlineCurrentDay } from "@/services/spot/market/hooks";
import { usePairByCode } from "@/services/spot/orders/hooks";

type MobilePanel = "chart" | "book" | "trade" | "orders";

const NATIVE_DECIMALS = 18;

function placeholderPairFromUrl(token0: string, token1: string): SpotPair {
  const base = token0.toUpperCase();
  const quote = token1.toUpperCase();
  return {
    baseSymbol: base,
    baseName: base,
    baseAddress: "0x0000000000000000000000000000000000000000",
    quoteSymbol: quote,
    pairCode: `${base}/${quote}`,
  };
}

export function SpotView({
  token0,
  token1,
}: {
  token0: string;
  token1: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { address } = useWallet();
  const chainId = useChainId();
  const targetChainId = getSwapTargetChainId();
  const configured = isSwapEnvConfigured();

  const defaultPath = getSpotDefaultPairPath();
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
        router.replace(`/spot/${defaultPath}`);
      }
    }
  }, [pairFetched, pairError, pairRsp, currentPath, defaultPath, router]);

  const pair = useMemo(
    () => (pairRsp ? pairRspToSpotPair(pairRsp) : placeholderPairFromUrl(token0, token1)),
    [pairRsp, token0, token1]
  );

  const pairId = pairRsp?.id;
  const enginePriceDecimal = pairRsp?.enginePriceDecimal;
  const pairReady = Boolean(pairRsp);

  const { data: kline } = useKlineCurrentDay(pairId, { enabled: pairId != null });

  const marketStats = useMemo(() => {
    if (!kline || enginePriceDecimal == null) {
      return { lastPrice: 0, change24hPct: 0 };
    }
    const stats = marketKlineToStats(kline, enginePriceDecimal);
    return { lastPrice: stats.lastPrice, change24hPct: stats.change24hPct };
  }, [kline, enginePriceDecimal]);

  const [timeframe, setTimeframe] = useState<ChartTimeframe>("1h");
  const [side, setSide] = useState<SpotSide>("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    setPrice("");
    setQuantity("");
  }, [pair.baseAddress]);

  const [ordersTab, setOrdersTab] = useState<SpotOrdersTab>("open");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("chart");

  const effectiveChainId = targetChainId ?? chainId;

  const { data: nativeBal } = useBalance({
    address,
    chainId: effectiveChainId,
    query: { enabled: Boolean(address && effectiveChainId) },
  });

  const { data: tokenBal } = useTokenBalance({
    token: pair.baseAddress,
    address,
    chainId: effectiveChainId,
    query: { enabled: Boolean(address && configured && pairReady) },
  });

  const { data: tokenDecimals } = useReadContract({
    address: pair.baseAddress,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: effectiveChainId,
    query: { enabled: configured && pairReady },
  });

  const decimals = Number(tokenDecimals ?? 18);

  const availableQuote = useMemo(() => {
    if (!nativeBal) return "0";
    return formatBalanceDisplay(nativeBal.value, NATIVE_DECIMALS);
  }, [nativeBal]);

  const availableBase = useMemo(() => {
    if (!tokenBal) return "0";
    return formatBalanceDisplay(tokenBal, decimals);
  }, [tokenBal, decimals]);

  const handlePairChange = useCallback(
    (path: string) => {
      router.push(`/spot/${path}`);
    },
    [router]
  );

  const handleLevelClick = useCallback((p: number, size: number) => {
    setPrice(String(p));
    setQuantity(String(Math.round(size * 100) / 100));
  }, []);

  const handlePlaceOrder = useCallback(
    (_partial: Omit<SpotOrder, "id" | "createdAt" | "status">) => {
      setQuantity("");
      setOrdersTab("open");
      setMobilePanel("orders");
    },
    []
  );

  const mobileTabs: { id: MobilePanel; label: string }[] = [
    { id: "chart", label: t("spot.mobileChart") },
    { id: "book", label: t("spot.mobileBook") },
    { id: "trade", label: t("spot.mobileTrade") },
    { id: "orders", label: t("spot.mobileOrders") },
  ];

  if (!configured) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg py-16 text-center">
          <p className="text-muted-foreground text-sm">{t("spot.envNotConfigured")}</p>
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
          <p className="text-muted-foreground text-sm">{t("spot.pairNotFound")}</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Mobile toolbar */}
      <SpotToolbar
        pair={pair}
        pairId={pairId}
        enginePriceDecimal={enginePriceDecimal}
        onPairChange={handlePairChange}
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
              <SpotPairList
                activePair={pair}
                className="hidden h-full min-h-0 rounded-none 2xl:flex"
              />
              <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1">
                <SpotToolbar
                  pair={pair}
                  pairId={pairId}
                  enginePriceDecimal={enginePriceDecimal}
                  onPairChange={handlePairChange}
                  hidePairSelectorOnWide
                  className="shrink-0 rounded-none border-x-0 border-t-0"
                />
                <SpotChartPanel
                  pair={pair}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  className="min-h-0 flex-1 rounded-none"
                />
              </div>
            </div>
            <SpotOrdersTabs
              tab={ordersTab}
              onTabChange={setOrdersTab}
              className="min-h-0 flex-[3] rounded-none"
            />
          </div>
          <SpotTradePanel
            pair={pair}
            pairId={pairId}
            enginePriceDecimal={enginePriceDecimal}
            side={side}
            price={price}
            quantity={quantity}
            lastPrice={marketStats.lastPrice}
            change24hPct={marketStats.change24hPct}
            availableBase={availableBase}
            availableQuote={availableQuote}
            onSideChange={setSide}
            onPriceChange={setPrice}
            onQuantityChange={setQuantity}
            onLevelClick={handleLevelClick}
            onPlaceOrder={handlePlaceOrder}
            className="h-full min-h-0 w-[min(820px,42%)] shrink-0 [&_section]:rounded-none"
          />
        </div>
      </div>

      {/* Mobile panels */}
      <div className="mt-2 space-y-3 lg:hidden">
        {mobilePanel === "chart" && (
          <SpotChartPanel
            pair={pair}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        )}
        {mobilePanel === "book" && (
          <div className="space-y-3">
            <SpotOrderBook
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
            <SpotMarketTrades
              pairId={pairId}
              enginePriceDecimal={enginePriceDecimal}
              pair={pair}
              className="min-h-[200px]"
            />
          </div>
        )}
        {mobilePanel === "trade" && (
          <SpotOrderForm
            pair={pair}
            side={side}
            price={price}
            quantity={quantity}
            lastPrice={marketStats.lastPrice}
            availableBase={availableBase}
            availableQuote={availableQuote}
            onSideChange={setSide}
            onPriceChange={setPrice}
            onQuantityChange={setQuantity}
            onPlaceOrder={handlePlaceOrder}
          />
        )}
        {mobilePanel === "orders" && (
          <SpotOrdersTabs tab={ordersTab} onTabChange={setOrdersTab} />
        )}
      </div>
    </PageShell>
  );
}
