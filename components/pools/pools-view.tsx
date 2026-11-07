"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CoinsIcon, GiftIcon, LockOpenIcon, PickaxeIcon, WalletIcon } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { PerpsPairList } from "@/components/perps/perps-pair-list";
import { PoolCard } from "@/components/pools/pool-card";
import {
  poolSummary,
  previewPools,
  STAKE_SYMBOL,
  SUMMARY_REWARD_SYMBOL,
  type PreviewPool,
} from "@/components/pools/preview-pools";
import { Switch } from "@/components/ui/switch";
import type { PerpsPair } from "@/lib/perps/types";
import { useI18n } from "@/providers/i18n-provider";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/** No pair is selected on this page; the list still links into perps. */
const IDLE_PAIR: PerpsPair = {
  baseSymbol: "",
  baseName: "",
  baseAddress: ZERO_ADDRESS,
  quoteSymbol: "",
  quoteAddress: ZERO_ADDRESS,
  pairCode: "",
};

function StatCard({
  icon: Icon,
  label,
  value,
  symbol,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  symbol: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3.5">
      <div className="bg-brand/10 text-brand ring-brand/15 flex size-9 shrink-0 items-center justify-center rounded-xl ring-1">
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground truncate text-xs">{label}</p>
        <p className="mt-0.5 truncate text-base font-semibold tabular-nums tracking-tight">
          {value}{" "}
          <span className="text-muted-foreground text-xs font-medium">{symbol}</span>
        </p>
      </div>
    </div>
  );
}

function FilterToggle({
  icon: Icon,
  label,
  checked,
  onCheckedChange,
}: {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="text-muted-foreground flex h-9 items-center gap-2 text-xs">
      <Icon className="size-4" aria-hidden />
      <span>{label}</span>
      <Switch
        size="sm"
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </label>
  );
}

function matchesPool(pool: PreviewPool, activeOnly: boolean, stakedOnly: boolean): boolean {
  if (activeOnly && !pool.open) return false;
  if (stakedOnly && !pool.stakedByMe) return false;
  return true;
}

export function PoolsView() {
  const { t } = useI18n();
  const [activeOnly, setActiveOnly] = useState(false);
  const [stakedOnly, setStakedOnly] = useState(false);

  const pools = useMemo(
    () => previewPools.filter((pool) => matchesPool(pool, activeOnly, stakedOnly)),
    [activeOnly, stakedOnly]
  );

  return (
    <PageShell className="flex min-h-0 flex-1 flex-col lg:h-[calc(100svh-3.5rem)]">
      <div className="flex min-h-0 flex-1 flex-col gap-1 lg:flex-row">
        <PerpsPairList
          activePair={IDLE_PAIR}
          lists="all"
          className="h-72 w-full shrink-0 rounded-none lg:h-auto lg:w-56"
        />
        <div className="border-border/60 bg-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border">
          <div className="border-border/60 grid shrink-0 grid-cols-2 border-b lg:grid-cols-4">
            <StatCard
              icon={WalletIcon}
              label={t("poolsPage.myStaked")}
              value={poolSummary.myStaked}
              symbol={STAKE_SYMBOL}
            />
            <StatCard
              icon={PickaxeIcon}
              label={t("poolsPage.totalStaked")}
              value={poolSummary.totalStaked}
              symbol={STAKE_SYMBOL}
            />
            <StatCard
              icon={CoinsIcon}
              label={t("poolsPage.myRewards")}
              value={poolSummary.myRewards}
              symbol={SUMMARY_REWARD_SYMBOL}
            />
            <StatCard
              icon={GiftIcon}
              label={t("poolsPage.totalRewards")}
              value={poolSummary.totalRewards}
              symbol={SUMMARY_REWARD_SYMBOL}
            />
          </div>
          <div className="border-border/60 flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2">
            <h1 className="text-sm font-semibold tracking-tight">{t("poolsPage.title")}</h1>
            <div className="flex items-center gap-4">
              <FilterToggle
                icon={LockOpenIcon}
                label={t("poolsPage.active")}
                checked={activeOnly}
                onCheckedChange={setActiveOnly}
              />
              <FilterToggle
                icon={PickaxeIcon}
                label={t("poolsPage.stakedOnly")}
                checked={stakedOnly}
                onCheckedChange={setStakedOnly}
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            {pools.length === 0 ? (
              <p className="text-muted-foreground py-16 text-center text-sm">
                {t("poolsPage.empty")}
              </p>
            ) : (
              <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),28rem))]">
                {pools.map((pool) => (
                  <PoolCard key={pool.id} pool={pool} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
