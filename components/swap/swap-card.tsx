"use client";

import { ArrowDownIcon, Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/providers/i18n-provider";

function TokenRow({
  label,
  token,
  balanceLabel,
}: {
  label: string;
  token: string;
  balanceLabel: string;
}) {
  const { t } = useI18n();
  return (
    <div className="bg-muted/50 border-border/60 space-y-2 rounded-2xl border p-3 sm:p-4">
      <div className="text-muted-foreground flex items-center justify-between text-xs font-medium sm:text-sm">
        <span>{label}</span>
        <span>
          {t("swap.balance")}: {balanceLabel}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          readOnly
          suppressHydrationWarning
          className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-2xl font-medium tracking-tight outline-none sm:text-3xl"
          placeholder={t("swap.enterAmount")}
          aria-label={label}
        />
        <button
          type="button"
          className="bg-card text-foreground ring-border inline-flex shrink-0 items-center gap-2 rounded-full py-2 pr-3 pl-3 text-sm font-semibold ring-1 transition hover:bg-muted/80"
        >
          <span className="max-w-[7rem] truncate">{token}</span>
          <ArrowDownIcon className="text-muted-foreground size-4" />
        </button>
      </div>
    </div>
  );
}

export function SwapCard() {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-8 sm:py-12">
      <div className="bg-[var(--dex-surface)] ring-border/60 rounded-[28px] p-1 shadow-lg ring-1">
        <div className="bg-[var(--dex-surface-elevated)] rounded-[24px] p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              {t("swap.title")}
            </h1>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label={t("swap.settings")}
            >
              <Settings2Icon className="size-4" />
            </Button>
          </div>

          <div className="relative flex flex-col gap-1">
            <TokenRow
              label={t("swap.sell")}
              token={t("swap.native")}
              balanceLabel="—"
            />
            <div className="relative z-10 -my-4 flex justify-center">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="border-background size-10 rounded-full border-4 shadow-sm"
                aria-label={t("swap.flip")}
              >
                <ArrowDownIcon className="size-4 rotate-180" />
              </Button>
            </div>
            <TokenRow
              label={t("swap.buy")}
              token={t("swap.stock")}
              balanceLabel="—"
            />
          </div>

          <div className="text-muted-foreground mt-4 space-y-2 px-1 text-xs sm:text-sm">
            <div className="flex justify-between gap-4">
              <span>{t("swap.rate")}</span>
              <span className="text-foreground text-right font-medium tabular-nums">
                1 {t("swap.stock")} ≈ 0.00421 {t("swap.native")}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{t("swap.priceImpact")}</span>
              <span className="text-right font-medium tabular-nums">&lt; 0.01%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{t("swap.reserveToken")}</span>
              <span className="text-right font-medium tabular-nums">100,000,000</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{t("swap.reserveQuote")}</span>
              <span className="text-right font-medium tabular-nums">4,200,000</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{t("swap.slippage")}</span>
              <span className="text-right font-medium tabular-nums">0.5%</span>
            </div>
          </div>

          <Button
            type="button"
            className="mt-5 h-12 w-full rounded-2xl text-base font-semibold"
            disabled
          >
            {t("swap.swapAction")}
          </Button>

          <p className="text-muted-foreground mt-3 px-1 text-center text-xs leading-relaxed">
            {t("swap.footerNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
