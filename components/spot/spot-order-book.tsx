"use client";

import { useMemo } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { formatSpotPct, formatSpotPrice, formatSpotSize } from "@/lib/spot/format";
import type { OrderBookLevel, SpotOrderBook } from "@/lib/spot/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

type LevelWithTotal = OrderBookLevel & { total: number };

function withTotals(levels: OrderBookLevel[], fromEnd: boolean): LevelWithTotal[] {
  let acc = 0;
  const ordered = fromEnd ? [...levels].reverse() : levels;
  const mapped = ordered.map((row) => {
    acc += row.size;
    return { ...row, total: acc };
  });
  return fromEnd ? mapped.reverse() : mapped;
}

export const ORDER_BOOK_DEPTH = 10;

export function SpotOrderBook({
  book,
  quoteSymbol,
  lastPrice,
  change24hPct,
  onLevelClick,
  className,
}: {
  book: SpotOrderBook;
  quoteSymbol: string;
  lastPrice: number;
  change24hPct: number;
  onLevelClick: (price: number, size: number) => void;
  className?: string;
}) {
  const { t } = useI18n();

  const asks = useMemo(
    () => withTotals(book.asks, true).slice(-ORDER_BOOK_DEPTH),
    [book.asks]
  );
  const bids = useMemo(
    () => withTotals(book.bids, false).slice(0, ORDER_BOOK_DEPTH),
    [book.bids]
  );

  const maxTotal = Math.max(
    asks[0]?.total ?? 0,
    bids[bids.length - 1]?.total ?? 1
  );

  const up = change24hPct >= 0;
  const changeTone = up ? "text-brand" : "text-brand-alt";

  return (
    <section
      className={cn(
        "border-border/60 bg-card flex shrink-0 flex-col overflow-hidden rounded-xl border",
        className
      )}
      aria-label={t("spot.orderBook")}
    >
      <div className="border-border/60 border-b px-3 py-2.5 sm:px-4">
        <h2 className="text-foreground text-sm font-medium">{t("spot.orderBook")}</h2>
      </div>

      <div className="text-muted-foreground grid grid-cols-2 gap-2 px-3 py-2 text-[11px] font-medium sm:px-4 sm:text-xs">
        <span>
          {t("spot.price")} ({quoteSymbol})
        </span>
        <span className="text-right">{t("spot.size")}</span>
      </div>

      <div className="scrollbar-none shrink-0 px-1 sm:px-2">
        {asks.map((row, i) => (
          <OrderBookRow
            key={`a-${i}`}
            row={row}
            side="ask"
            maxTotal={maxTotal}
            onClick={() => onLevelClick(row.price, row.size)}
          />
        ))}
        <div
          className={cn(
            "bg-muted/40 my-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold tabular-nums sm:text-sm",
            changeTone
          )}
        >
          <span>{formatSpotPrice(lastPrice)}</span>
          {up ? (
            <ChevronUpIcon className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <ChevronDownIcon className="size-3.5 shrink-0" aria-hidden />
          )}
          <span className="text-xs sm:text-sm">{formatSpotPct(change24hPct)}</span>
        </div>
        {bids.map((row, i) => (
          <OrderBookRow
            key={`b-${i}`}
            row={row}
            side="bid"
            maxTotal={maxTotal}
            onClick={() => onLevelClick(row.price, row.size)}
          />
        ))}
      </div>
    </section>
  );
}

function OrderBookRow({
  row,
  side,
  maxTotal,
  onClick,
}: {
  row: LevelWithTotal;
  side: "ask" | "bid";
  maxTotal: number;
  onClick: () => void;
}) {
  const depthPct = maxTotal > 0 ? (row.total / maxTotal) * 100 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-muted/50 relative grid w-full grid-cols-2 gap-2 px-2 py-0.5 text-left text-[11px] sm:text-xs"
    >
      <span
        className={cn(
          "absolute inset-y-0 opacity-20",
          side === "ask" ? "bg-brand-alt right-0 left-auto" : "bg-brand left-0"
        )}
        style={{ width: `${depthPct}%` }}
        aria-hidden
      />
      <span
        className={cn(
          "relative tabular-nums",
          side === "ask" ? "text-brand-alt" : "text-brand"
        )}
      >
        {formatSpotPrice(row.price)}
      </span>
      <span className="relative text-right tabular-nums">{formatSpotSize(row.size)}</span>
    </button>
  );
}
