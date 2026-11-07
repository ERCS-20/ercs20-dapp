"use client";

import { useState, type ReactNode } from "react";
import { PickaxeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STAKE_SYMBOL, type PreviewPool } from "@/components/pools/preview-pools";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

function ContextStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-muted-foreground text-[11px] leading-none">{label}</p>
      <p className="mt-1.5 truncate text-sm font-medium tabular-nums">{value}</p>
    </div>
  );
}

function ContextRow({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-border/60 flex items-center justify-between gap-3 border-t px-4 py-2.5">
      <span className="text-muted-foreground shrink-0 text-xs">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 truncate text-sm font-medium tabular-nums">{value}</span>
        {action}
      </div>
    </div>
  );
}

function AmountField({
  id,
  label,
  suffix,
  value,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  suffix: string;
  value: string;
  hint: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 rounded-2xl pr-16 tabular-nums"
        />
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium">
          {suffix}
        </span>
      </div>
      <p className="text-muted-foreground text-xs tabular-nums">{hint}</p>
    </div>
  );
}

function PoolCardHeader({ pool }: { pool: PreviewPool }) {
  const { t } = useI18n();

  return (
    <div className="border-border/60 bg-brand/5 shrink-0 border-b px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="bg-brand/15 text-brand ring-brand/20 flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1">
          <PickaxeIcon aria-hidden className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold tracking-tight">{pool.symbol}</h2>
          <p className="text-muted-foreground mt-1.5 flex min-w-0 items-center gap-2 text-sm leading-relaxed">
            <span className="min-w-0 truncate">{pool.name}</span>
            <span
              className={cn(
                "inline-flex h-5 shrink-0 items-center rounded-md px-1.5 text-[11px] font-semibold",
                pool.open ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground"
              )}
            >
              {pool.open ? t("poolsPage.statusOpen") : t("poolsPage.statusClosed")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function PoolCard({ pool }: { pool: PreviewPool }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"stake" | "unstake">("stake");
  const [amount, setAmount] = useState("");
  const staking = mode === "stake";
  const apr = pool.apr == null ? t("poolsPage.infinity") : `${pool.apr}%`;
  const actionDisabled = staking ? !pool.open : !pool.canUnstake;

  return (
    <article className="border-foreground/15 bg-card flex flex-col overflow-hidden rounded-2xl border shadow-[0_0_22px_color-mix(in_oklab,var(--foreground)_12%,transparent)]">
      <PoolCardHeader pool={pool} />
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="border-input bg-background overflow-hidden rounded-xl border">
          <div className="grid grid-cols-2 divide-x divide-border/60">
            <ContextStat label={t("poolsPage.apr")} value={apr} />
            <ContextStat label={t("poolsPage.rewards")} value={`${pool.rewards} ${pool.symbol}`} />
          </div>
          <ContextRow label={t("poolsPage.staked")} value={`${pool.staked} ${STAKE_SYMBOL}`} />
          <ContextRow
            label={t("poolsPage.myRewards")}
            value={`${pool.myRewards} ${pool.symbol}`}
            action={
              <Button
                type="button"
                variant="outline"
                className="h-7 rounded-lg px-2.5 text-xs"
                disabled={!pool.canHarvest}
              >
                {t("poolsPage.harvest")}
              </Button>
            }
          />
          <ContextRow label={t("poolsPage.myStaked")} value={`${pool.myStaked} ${STAKE_SYMBOL}`} />
        </div>
        <Tabs
          value={mode}
          onValueChange={(value) => {
            setMode(value as "stake" | "unstake");
            setAmount("");
          }}
          className="w-full"
        >
          <TabsList className="h-9 w-full">
            <TabsTrigger value="stake" className="flex-1 text-xs sm:text-sm">
              {t("poolsPage.stake")}
            </TabsTrigger>
            <TabsTrigger value="unstake" className="flex-1 text-xs sm:text-sm">
              {t("poolsPage.unstake")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <AmountField
          id={`pool-amount-${pool.id}`}
          label={t("poolsPage.amount")}
          suffix={STAKE_SYMBOL}
          value={amount}
          hint={
            staking
              ? `${t("poolsPage.balance")}: ${pool.balance} ${STAKE_SYMBOL}`
              : `${t("poolsPage.myStaked")}: ${pool.myStaked} ${STAKE_SYMBOL}`
          }
          onChange={setAmount}
        />
      </div>
      <div className="border-border/60 bg-muted/30 shrink-0 border-t px-5 py-4">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-xl"
          disabled={actionDisabled}
        >
          {staking ? t("poolsPage.stake") : t("poolsPage.unstake")}
        </Button>
      </div>
    </article>
  );
}
