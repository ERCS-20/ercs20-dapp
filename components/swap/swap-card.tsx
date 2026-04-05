"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowDownIcon, Settings2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";
import { useI18n } from "@/providers/i18n-provider";

const DISCONNECTED = "--";
const STOCK_PER_NATIVE = 0.00421;

function UsdcIcon() {
  return (
    <Image
      src="/tokens/usdc.svg"
      alt=""
      width={28}
      height={28}
      className="size-7 shrink-0 rounded-full ring-1 ring-black/10 transition-transform duration-300 ease-out group-hover:scale-105 dark:ring-white/14"
      priority
      unoptimized
    />
  );
}

function Ercs20Icon() {
  return (
    <span
      className="bg-card text-foreground flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/15 text-[10px] font-semibold tracking-[0.08em] ring-1 ring-primary/10 dark:border-primary/25 dark:ring-primary/15"
      aria-hidden
    >
      E
    </span>
  );
}

function TokenRow({
  label,
  token,
  balanceLabel,
  amountPlaceholder,
  tokenIcon,
}: {
  label: string;
  token: string;
  balanceLabel: string;
  amountPlaceholder: string;
  tokenIcon: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="bg-muted/50 border-border/60 space-y-1.5 rounded-2xl border p-2.5 sm:p-3">
      <div className="text-muted-foreground flex items-center justify-between text-xs font-medium sm:text-sm">
        <span>{label}</span>
        <span>
          {t("swap.balance")}: {balanceLabel}
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <input
          readOnly
          suppressHydrationWarning
          className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-tight outline-none sm:text-3xl"
          placeholder={amountPlaceholder}
          aria-label={label}
        />
        <button
          type="button"
          className="group bg-card text-foreground ring-border inline-flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-2.5 pl-2 text-sm font-semibold ring-1 transition hover:bg-muted/80 sm:py-2 sm:pr-3 sm:pl-2.5"
          aria-label={`${t("swap.selectToken")}: ${token}`}
        >
          {tokenIcon}
          <span className="max-w-[6.5rem] truncate sm:max-w-[7rem]">{token}</span>
        </button>
      </div>
    </div>
  );
}

export function SwapCard() {
  const { t } = useI18n();
  const { isConnected } = useWallet();
  const [flipped, setFlipped] = useState(false);

  const balanceLabel = isConnected ? "—" : DISCONNECTED;
  const amountPh = isConnected ? t("swap.enterAmount") : DISCONNECTED;

  const native = t("swap.native");
  const stock = t("swap.stock");

  const rateLabel = useMemo(() => {
    if (!isConnected) return DISCONNECTED;
    if (flipped) {
      const per = 1 / STOCK_PER_NATIVE;
      const rounded =
        per >= 100
          ? per.toLocaleString(undefined, { maximumFractionDigits: 0 })
          : per.toLocaleString(undefined, { maximumFractionDigits: 2 });
      return `1 ${native} ≈ ${rounded} ${stock}`;
    }
    return `1 ${stock} ≈ ${STOCK_PER_NATIVE} ${native}`;
  }, [flipped, isConnected, native, stock]);

  const sellIcon = flipped ? <Ercs20Icon /> : <UsdcIcon />;
  const buyIcon = flipped ? <UsdcIcon /> : <Ercs20Icon />;
  const sellToken = flipped ? stock : native;
  const buyToken = flipped ? native : stock;

  return (
    <section
      className="mx-auto w-full max-w-[480px] px-4 py-8 sm:py-12"
      aria-labelledby="swap-title"
    >
      <div className="bg-[var(--dex-surface)] ring-border/60 rounded-[28px] p-1 shadow-lg ring-1">
        <div className="bg-[var(--dex-surface-elevated)] rounded-[24px] p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
            <h1
              id="swap-title"
              className="text-primary text-lg font-semibold tracking-tight sm:text-xl"
            >
              {t("swap.title")}
            </h1>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground shrink-0 rounded-full"
              aria-label={t("swap.settings")}
              onClick={() => toast.message(t("swap.settingsPlaceholder"))}
            >
              <Settings2Icon className="size-4" strokeWidth={1.5} />
            </Button>
          </div>

          <div className="relative flex flex-col gap-0">
            <TokenRow
              label={t("swap.sell")}
              token={sellToken}
              balanceLabel={balanceLabel}
              amountPlaceholder={amountPh}
              tokenIcon={sellIcon}
            />
            <div className="relative z-10 flex justify-center -my-3 sm:-my-4">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="border-background size-9 rounded-full border-[3px] bg-card shadow-md transition-[transform,box-shadow] duration-200 ease-out hover:scale-105 hover:shadow-lg active:scale-95 sm:size-10 sm:border-4"
                aria-label={t("swap.flip")}
                aria-pressed={flipped}
                onClick={() => setFlipped((v) => !v)}
              >
                <ArrowDownIcon
                  className={cn(
                    "size-4 transition-transform duration-300 ease-out",
                    flipped ? "rotate-0" : "rotate-180"
                  )}
                  strokeWidth={1.5}
                />
              </Button>
            </div>
            <TokenRow
              label={t("swap.buy")}
              token={buyToken}
              balanceLabel={balanceLabel}
              amountPlaceholder={amountPh}
              tokenIcon={buyIcon}
            />
          </div>

          <dl className="text-muted-foreground mt-3 space-y-2 px-1 text-xs sm:mt-4 sm:text-sm">
            <div className="flex justify-between gap-4">
              <dt>{t("swap.rate")}</dt>
              <dd className="text-foreground text-right font-medium tabular-nums">
                {rateLabel}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("swap.priceImpact")}</dt>
              <dd className="text-right font-medium tabular-nums">
                {isConnected ? "< 0.01%" : DISCONNECTED}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("swap.reserveToken")}</dt>
              <dd className="text-right font-medium tabular-nums">
                {isConnected ? "100,000,000" : DISCONNECTED}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("swap.reserveQuote")}</dt>
              <dd className="text-right font-medium tabular-nums">
                {isConnected ? "4,200,000" : DISCONNECTED}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{t("swap.slippage")}</dt>
              <dd className="text-right font-medium tabular-nums">
                {isConnected ? "0.5%" : DISCONNECTED}
              </dd>
            </div>
          </dl>

          <Button
            type="button"
            disabled
            className={cn(
              "mt-5 h-12 w-full rounded-2xl border-0 text-base font-semibold",
              "bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:enabled:bg-primary/90",
              "dark:shadow-primary/20",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none"
            )}
          >
            {t("swap.swapAction")}
          </Button>
        </div>
      </div>
    </section>
  );
}
