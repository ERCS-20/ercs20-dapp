"use client";

import type { ReactNode } from "react";
import { ArrowDownIcon, Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { useI18n } from "@/providers/i18n-provider";

const DISCONNECTED = "--";

function UsdcIcon() {
  return (
    <img
      src="/tokens/usdc.svg"
      alt=""
      width={28}
      height={28}
      className="size-7 shrink-0 rounded-full ring-1 ring-black/8 dark:ring-white/12"
    />
  );
}

function Ercs20Icon() {
  return (
    <span
      className="bg-card text-foreground flex size-7 shrink-0 items-center justify-center rounded-full border border-border/70 text-[10px] font-semibold tracking-[0.08em] ring-1 ring-border/35"
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
          className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-2xl font-medium tracking-tight outline-none sm:text-3xl"
          placeholder={amountPlaceholder}
          aria-label={label}
        />
        <button
          type="button"
          className="bg-card text-foreground ring-border inline-flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-2.5 pl-2 text-sm font-semibold ring-1 transition hover:bg-muted/80 sm:py-2 sm:pr-3 sm:pl-2.5"
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
  const balanceLabel = isConnected ? "—" : DISCONNECTED;
  const amountPh = isConnected ? t("swap.enterAmount") : DISCONNECTED;

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-8 sm:py-12">
      <div className="bg-[var(--dex-surface)] ring-border/60 rounded-[28px] p-1 shadow-lg ring-1">
        <div className="bg-[var(--dex-surface-elevated)] rounded-[24px] p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
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

          <div className="relative flex flex-col gap-0">
            <TokenRow
              label={t("swap.sell")}
              token={t("swap.native")}
              balanceLabel={balanceLabel}
              amountPlaceholder={amountPh}
              tokenIcon={<UsdcIcon />}
            />
            <div className="relative z-10 -my-5 flex justify-center sm:-my-4">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="border-background size-9 rounded-full border-[3px] shadow-sm sm:size-10 sm:border-4"
                aria-label={t("swap.flip")}
              >
                <ArrowDownIcon className="size-4 rotate-180" />
              </Button>
            </div>
            <TokenRow
              label={t("swap.buy")}
              token={t("swap.stock")}
              balanceLabel={balanceLabel}
              amountPlaceholder={amountPh}
              tokenIcon={<Ercs20Icon />}
            />
          </div>

          <div className="text-muted-foreground mt-3 space-y-2 px-1 text-xs sm:mt-4 sm:text-sm">
            <div className="flex justify-between gap-4">
              <span>{t("swap.rate")}</span>
              <span className="text-foreground text-right font-medium tabular-nums">
                {isConnected
                  ? `1 ${t("swap.stock")} ≈ 0.00421 ${t("swap.native")}`
                  : DISCONNECTED}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{t("swap.priceImpact")}</span>
              <span className="text-right font-medium tabular-nums">
                {isConnected ? "< 0.01%" : DISCONNECTED}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{t("swap.reserveToken")}</span>
              <span className="text-right font-medium tabular-nums">
                {isConnected ? "100,000,000" : DISCONNECTED}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{t("swap.reserveQuote")}</span>
              <span className="text-right font-medium tabular-nums">
                {isConnected ? "4,200,000" : DISCONNECTED}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{t("swap.slippage")}</span>
              <span className="text-right font-medium tabular-nums">
                {isConnected ? "0.5%" : DISCONNECTED}
              </span>
            </div>
          </div>

          <Button
            type="button"
            className="mt-5 h-12 w-full rounded-2xl text-base font-semibold"
            disabled
          >
            {t("swap.swapAction")}
          </Button>
        </div>
      </div>
    </div>
  );
}
