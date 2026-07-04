"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import type { UserBalanceRsp } from "@/services/asset/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

const tokenSelectSheetClass = cn(
  "flex max-h-[88vh] w-full flex-col gap-0 overflow-hidden rounded-2xl border border-border/60 p-0 shadow-xl",
  "max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:max-h-[82vh] max-md:max-w-full max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none max-md:rounded-t-3xl max-md:border-x-0 max-md:border-t max-md:border-b-0",
  "max-md:data-[state=open]:slide-in-from-bottom-6 max-md:data-[state=closed]:slide-out-to-bottom-6",
  "md:left-1/2 md:top-1/2 md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:data-[state=open]:zoom-in-95 md:data-[state=closed]:zoom-out-95"
);

const tokenSelectListClass = cn(
  "min-h-48 overflow-y-auto overscroll-contain",
  "max-h-[min(420px,50vh)] md:max-h-[min(400px,55vh)]"
);

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balances: UserBalanceRsp[];
  onSelect: (account: UserBalanceRsp) => void;
};

function TokenRowIcon({ symbol }: { symbol: string }) {
  const s = symbol.trim() || "TOKEN";
  return (
    <Image
      src={getTokenIconSrc(s)}
      alt=""
      width={36}
      height={36}
      className="size-9 shrink-0 rounded-full ring-1 ring-border/60"
      unoptimized
    />
  );
}

export function ProfileTokenSelectSheet({ open, onOpenChange, balances, onSelect }: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return balances;
    return balances.filter(
      (row) =>
        row.symbol.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.tokenAddress.toLowerCase().includes(q)
    );
  }, [balances, query]);

  const pick = (row: UserBalanceRsp) => {
    onSelect(row);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        className={tokenSelectSheetClass}
      >
        <DialogHeader className="border-border/50 shrink-0 border-b px-4 pt-4 pr-14 pb-3 md:px-5 md:pt-5 md:pb-4">
          <DialogTitle>{t("swap.selectToken")}</DialogTitle>
          <DialogDescription className="sr-only">{t("swap.searchTokens")}</DialogDescription>
        </DialogHeader>
        <div className="shrink-0 px-4 pt-3 pb-2 md:px-5 md:pt-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("swap.searchTokens")}
            className="h-10"
            autoComplete="off"
            autoCorrect="off"
          />
        </div>
        <div className={tokenSelectListClass}>
          {results.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              {t("swap.noTokenResults")}
            </p>
          ) : (
            <ul className="divide-border/60 divide-y px-1 pb-2 md:px-2">
              {results.map((row) => (
                <li key={row.tokenAddress}>
                  <button
                    type="button"
                    className={cn(
                      "hover:bg-muted/70 flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors",
                      "md:gap-3.5 md:px-3"
                    )}
                    onClick={() => pick(row)}
                  >
                    <TokenRowIcon symbol={row.symbol} />
                    <div className="min-w-0 flex-1 leading-tight">
                      <div
                        className="text-foreground font-mono text-xs tracking-tight truncate md:text-[13px]"
                        title={row.tokenAddress}
                      >
                        {row.tokenAddress}
                      </div>
                      <div className="text-foreground mt-0.5 text-sm font-semibold truncate">
                        {row.symbol}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
