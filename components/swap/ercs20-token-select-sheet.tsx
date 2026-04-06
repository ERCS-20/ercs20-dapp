"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  listBrowseableErcs20Tokens,
  searchErcs20Tokens,
} from "@/lib/tokens/ercs20-search";
import type { Ercs20TokenMeta } from "@/lib/tokens/ercs20-types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factory: `0x${string}`;
  chainId: number;
  onSelect: (meta: Ercs20TokenMeta) => void;
};

export function Ercs20TokenSelectSheet({
  open,
  onOpenChange,
  factory,
  chainId,
  onSelect,
}: Props) {
  const { t } = useI18n();
  const client = usePublicClient({ chainId });
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Ercs20TokenMeta[]>([]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    if (!client) {
      setResults([]);
      return;
    }
    let cancelled = false;
    if (!debounced) {
      setResults(listBrowseableErcs20Tokens());
      return;
    }
    setLoading(true);
    void (async () => {
      try {
        const r = await searchErcs20Tokens(client, factory, debounced);
        if (!cancelled) setResults(r);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, debounced, client, factory]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="border-t px-4 pb-6 pt-3 sm:max-w-none"
        showCloseButton
      >
        <SheetHeader className="mb-3 p-0 text-left">
          <SheetTitle className="text-lg">{t("swap.selectToken")}</SheetTitle>
        </SheetHeader>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("swap.searchTokens")}
          className="mb-3 h-10"
          autoComplete="off"
          autoCorrect="off"
        />
        <div className="text-muted-foreground min-h-48 max-h-[50vh] space-y-1 overflow-y-auto text-sm">
          {loading ? (
            <p className="py-6 text-center">{t("swap.loading")}</p>
          ) : results.length === 0 ? (
            <p className="py-6 text-center">{t("swap.noTokenResults")}</p>
          ) : (
            results.map((row) => (
              <Button
                key={row.address}
                type="button"
                variant="ghost"
                className={cn(
                  "h-auto w-full justify-start gap-2 px-2 py-2.5 font-normal"
                )}
                onClick={() => {
                  onSelect(row);
                  onOpenChange(false);
                }}
              >
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-foreground font-medium">{row.symbol}</div>
                  <div className="text-muted-foreground truncate text-xs">
                    {row.name}
                  </div>
                  <div className="text-muted-foreground font-mono text-[0.65rem] opacity-80">
                    {row.address}
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
