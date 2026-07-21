"use client";

import { useMemo } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { useCachedOrderBook } from "@/hooks/use-cached-order-book";
import { ORDER_BOOK_DISPLAY_DEPTH } from "@/lib/spot/order-book-cache";
import { formatPercentChange, formatQuantity, formatSubscriptPrice } from "@/lib/utils/price";
import type { OrderBookLevel } from "@/lib/spot/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

type LevelWithTotal = OrderBookLevel & { total: number; placeholder?: boolean };

const EMPTY_LEVEL: LevelWithTotal = {
  price: 0,
  size: 0,
  total: 0,
  placeholder: true,
};

function padAsks(rows: LevelWithTotal[], depth: number): LevelWithTotal[] {
  if (rows.length >= depth) return rows;
  return [
    ...Array.from({ length: depth - rows.length }, () => EMPTY_LEVEL),
    ...rows,
  ];
}

function padBids(rows: LevelWithTotal[], depth: number): LevelWithTotal[] {
  if (rows.length >= depth) return rows;
  return [
    ...rows,
    ...Array.from({ length: depth - rows.length }, () => EMPTY_LEVEL),
  ];
}

/** Cumulative size from spread outward; `levels[0]` is farthest from mid. */
function withTotalsFromSpread(levels: OrderBookLevel[]): LevelWithTotal[] {
  const n = levels.length;
  if (n === 0) return [];
  const out: LevelWithTotal[] = new Array(n);
  let acc = 0;
  for (let i = n - 1; i >= 0; i--) {
    acc += levels[i].size;
    out[i] = { ...levels[i], total: acc };
  }
  return out;
}

function withTotals(levels: OrderBookLevel[]): LevelWithTotal[] {
  let acc = 0;
  return levels.map((row) => {
    acc += row.size;
    return { ...row, total: acc };
  });
}

export const ORDER_BOOK_DEPTH = ORDER_BOOK_DISPLAY_DEPTH;

export function SpotOrderBook({
  pairId,
  enginePriceDecimal,
  quoteSymbol,
  lastPrice,
  change24hPct,
  onLevelClick,
  className,
}: {
  pairId: number | undefined;
  enginePriceDecimal: number | undefined;
  quoteSymbol: string;
  lastPrice: number;
  change24hPct: number;
  onLevelClick: (price: number, size: number) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const { bids, asks, isLoading } = useCachedOrderBook(pairId, enginePriceDecimal);

  const askRows = useMemo(
    () => padAsks(withTotalsFromSpread(asks), ORDER_BOOK_DEPTH),
    [asks]
  );
  const bidRows = useMemo(
    () => padBids(withTotals(bids), ORDER_BOOK_DEPTH),
    [bids]
  );

  const maxTotal = Math.max(
    askRows[0]?.total ?? 0,
    bidRows[bidRows.length - 1]?.total ?? 1
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
        {askRows.map((row, i) => (
          <OrderBookRow
            key={`a-${row.placeholder ? "empty" : row.price}-${i}`}
            row={row}
            side="ask"
            maxTotal={maxTotal}
            enginePriceDecimal={enginePriceDecimal}
            onClick={
              row.placeholder
                ? undefined
                : () => onLevelClick(row.price, row.size)
            }
          />
        ))}
        <div
          className={cn(
            "bg-muted/40 my-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold tabular-nums sm:text-sm",
            changeTone
          )}
        >
          {isLoading ? (
            <span className="text-muted-foreground font-normal">{t("swap.loading")}</span>
          ) : (
            <>
              <span>{formatSubscriptPrice(lastPrice, enginePriceDecimal ?? 8)}</span>
              {up ? (
                <ChevronUpIcon className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <ChevronDownIcon className="size-3.5 shrink-0" aria-hidden />
              )}
              <span className="text-xs sm:text-sm">{formatPercentChange(change24hPct)}</span>
            </>
          )}
        </div>
        {bidRows.map((row, i) => (
          <OrderBookRow
            key={`b-${row.placeholder ? "empty" : row.price}-${i}`}
            row={row}
            side="bid"
            maxTotal={maxTotal}
            enginePriceDecimal={enginePriceDecimal}
            onClick={
              row.placeholder
                ? undefined
                : () => onLevelClick(row.price, row.size)
            }
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
  enginePriceDecimal,
  onClick,
}: {
  row: LevelWithTotal;
  side: "ask" | "bid";
  maxTotal: number;
  enginePriceDecimal: number | undefined;
  onClick?: () => void;
}) {
  const depthPct =
    row.placeholder || maxTotal <= 0 ? 0 : (row.total / maxTotal) * 100;

  const priceLabel =
    row.placeholder || enginePriceDecimal == null
      ? "—"
      : formatSubscriptPrice(row.price, enginePriceDecimal);

  const content = (
    <>
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
          row.placeholder
            ? "text-muted-foreground/40"
            : side === "ask"
              ? "text-brand-alt"
              : "text-brand"
        )}
      >
        {priceLabel}
      </span>
      <span
        className={cn(
          "relative text-right tabular-nums",
          row.placeholder && "text-muted-foreground/40"
        )}
      >
        {row.placeholder ? "—" : formatQuantity(row.size)}
      </span>
    </>
  );

  if (row.placeholder || !onClick) {
    return (
      <div
        className="relative grid w-full grid-cols-2 gap-2 px-2 py-0.5 text-[11px] sm:text-xs"
        aria-hidden
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-muted/50 relative grid w-full grid-cols-2 gap-2 px-2 py-0.5 text-left text-[11px] sm:text-xs"
    >
      {content}
    </button>
  );
}
