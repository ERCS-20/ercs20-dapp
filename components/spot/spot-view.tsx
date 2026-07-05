"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBalance, useChainId, useReadContract } from "wagmi";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/page-shell";
import { SpotBottomPanel, type BottomTab } from "@/components/spot/spot-bottom-panel";
import { SpotChartPanel } from "@/components/spot/spot-chart-panel";
import { SpotMarketTrades } from "@/components/spot/spot-market-trades";
import { SpotOrderBook } from "@/components/spot/spot-order-book";
import { SpotOrderForm } from "@/components/spot/spot-order-form";
import { SpotPairList } from "@/components/spot/spot-pair-list";
import { SpotToolbar } from "@/components/spot/spot-toolbar";
import { SpotTradePanel } from "@/components/spot/spot-trade-panel";
import { erc20Abi } from "@/lib/contracts/abis";
import { getSwapTargetChainId, isSwapEnvConfigured } from "@/lib/config/swap-target";
import {
  findPairByPath,
  getMockMarketStats,
  getMockMarketTrades,
  getMockOrderBook,
  getMockUserTradeHistory,
  getSpotPairs,
  pairPath,
} from "@/lib/spot/mock-market";
import type {
  ChartTimeframe,
  SpotOrder,
  SpotPair,
  SpotSide,
  SpotUserTrade,
} from "@/lib/spot/types";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { useWallet } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";
import { formatBalanceDisplay } from "@/components/spot/spot-bottom-panel";

type MobilePanel = "chart" | "book" | "trade" | "orders";

const NATIVE_DECIMALS = 18;

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

  const pairs = useMemo(() => getSpotPairs(), []);
  const pair = useMemo(() => {
    const found = findPairByPath(pairs, token0, token1);
    return found ?? pairs[0]!;
  }, [pairs, token0, token1]);

  useEffect(() => {
    const found = findPairByPath(pairs, token0, token1);
    if (!found && pairs[0]) {
      router.replace(`/spot/${pairPath(pairs[0])}`);
    }
  }, [pairs, token0, token1, router]);

  const stats = useMemo(() => getMockMarketStats(pair), [pair]);
  const book = useMemo(() => getMockOrderBook(pair), [pair]);
  const marketTrades = useMemo(() => getMockMarketTrades(pair), [pair]);
  const seedTradeHistory = useMemo(() => getMockUserTradeHistory(pair), [pair]);

  const [timeframe, setTimeframe] = useState<ChartTimeframe>("1h");
  const [side, setSide] = useState<SpotSide>("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const [openOrders, setOpenOrders] = useState<SpotOrder[]>([]);
  const [historyOrders, setHistoryOrders] = useState<SpotOrder[]>([]);
  const [userTrades, setUserTrades] = useState<SpotUserTrade[]>([]);

  useEffect(() => {
    setUserTrades(seedTradeHistory);
    setPrice("");
    setQuantity("");
  }, [pair.baseAddress, seedTradeHistory]);

  const [bottomTab, setBottomTab] = useState<BottomTab>("open");
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
    query: { enabled: Boolean(address && configured) },
  });

  const { data: tokenDecimals } = useReadContract({
    address: pair.baseAddress,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: effectiveChainId,
    query: { enabled: configured },
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
    (p: SpotPair) => {
      router.push(`/spot/${pairPath(p)}`);
    },
    [router]
  );

  const handleLevelClick = useCallback((p: number, size: number) => {
    setPrice(String(p));
    setQuantity(String(Math.round(size * 100) / 100));
  }, []);

  const handlePlaceOrder = useCallback(
    (partial: Omit<SpotOrder, "id" | "createdAt" | "status">) => {
      const order: SpotOrder = {
        ...partial,
        id: `sim-${Date.now()}`,
        createdAt: Date.now(),
        status: "open",
      };
      setOpenOrders((prev) => [order, ...prev]);
      setQuantity("");
      setBottomTab("open");
      setMobilePanel("orders");
    },
    []
  );

  const handleCancelOrder = useCallback(
    (id: string) => {
      setOpenOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, cancelStatus: "cancelling" as const } : o
        )
      );
      toast.message(t("spot.cancelPending"));
    },
    [t]
  );

  const handleClaimCancel = useCallback(
    (id: string) => {
      setOpenOrders((prev) => {
        const target = prev.find((o) => o.id === id);
        if (!target) return prev;
        setHistoryOrders((h) => [
          { ...target, status: "cancelled", cancelStatus: "normal" },
          ...h,
        ]);
        toast.success(t("spot.orderCancelled"));
        return prev.filter((o) => o.id !== id);
      });
    },
    [t]
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

  return (
    <PageShell>
      {/* Mobile toolbar */}
      <SpotToolbar
        pairs={pairs}
        pair={pair}
        stats={stats}
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
                pairs={pairs}
                activePair={pair}
                className="hidden h-full min-h-0 rounded-none 2xl:flex"
              />
              <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1">
                <SpotToolbar
                  pairs={pairs}
                  pair={pair}
                  stats={stats}
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
            <SpotBottomPanel
              tab={bottomTab}
              onTabChange={setBottomTab}
              openOrders={openOrders}
              historyOrders={historyOrders}
              tradeHistory={userTrades}
              onCancelOrder={handleCancelOrder}
              onClaimCancel={handleClaimCancel}
              className="min-h-0 flex-[3] rounded-none"
            />
          </div>
          <SpotTradePanel
            pair={pair}
            book={book}
            trades={marketTrades}
            side={side}
            price={price}
            quantity={quantity}
            lastPrice={stats.lastPrice}
            change24hPct={stats.change24hPct}
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
              book={book}
              quoteSymbol={pair.quoteSymbol}
              lastPrice={stats.lastPrice}
              change24hPct={stats.change24hPct}
              onLevelClick={(p, s) => {
                handleLevelClick(p, s);
                setMobilePanel("trade");
              }}
              className="min-h-[320px]"
            />
            <SpotMarketTrades trades={marketTrades} pair={pair} className="min-h-[200px]" />
          </div>
        )}
        {mobilePanel === "trade" && (
          <SpotOrderForm
            pair={pair}
            side={side}
            price={price}
            quantity={quantity}
            lastPrice={stats.lastPrice}
            availableBase={availableBase}
            availableQuote={availableQuote}
            onSideChange={setSide}
            onPriceChange={setPrice}
            onQuantityChange={setQuantity}
            onPlaceOrder={handlePlaceOrder}
          />
        )}
        {mobilePanel === "orders" && (
          <SpotBottomPanel
            tab={bottomTab}
            onTabChange={setBottomTab}
            openOrders={openOrders}
            historyOrders={historyOrders}
            tradeHistory={userTrades}
            onCancelOrder={handleCancelOrder}
            onClaimCancel={handleClaimCancel}
          />
        )}
      </div>
    </PageShell>
  );
}
