"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/providers/i18n-provider";

export function FactoryCreateCard() {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <div className="bg-[var(--dex-surface)] ring-border/70 rounded-[28px] p-1 shadow-xl shadow-foreground/5 ring-1 transition-[box-shadow] duration-500 ease-out dark:shadow-black/40 hover:shadow-2xl hover:shadow-foreground/8 dark:hover:shadow-black/50">
        <div className="bg-[var(--dex-surface-elevated)] rounded-[24px] p-4 sm:p-6">
          <h1 className="text-xl font-semibold tracking-tight">
            {t("ercs20.title")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("ercs20.subtitle")}
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fc-name">{t("ercs20.name")}</Label>
              <Input id="fc-name" placeholder="Example Corp" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fc-symbol">{t("ercs20.symbol")}</Label>
              <Input id="fc-symbol" placeholder="EXMPL" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fc-supply">{t("ercs20.totalSupply")}</Label>
              <Input id="fc-supply" placeholder="100000000000000000000000000" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fc-seed">{t("ercs20.seedQuote")}</Label>
              <Input id="fc-seed" placeholder="10000000000000000000000000" readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fc-owner">{t("ercs20.newOwner")}</Label>
              <Input id="fc-owner" placeholder="0x…" readOnly />
            </div>
          </div>

          <Button
            type="button"
            className="mt-8 h-12 w-full rounded-2xl text-base font-semibold"
            style={{
              background: "var(--dex-accent)",
              color: "var(--dex-accent-foreground)",
            }}
            disabled
          >
            {t("ercs20.submit")}
          </Button>

          <p className="text-muted-foreground mt-3 text-center text-xs">
            {t("ercs20.hint")}
          </p>
        </div>
      </div>
    </div>
  );
}
