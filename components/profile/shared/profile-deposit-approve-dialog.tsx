"use client";

import Image from "next/image";
import { ShieldCheckIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  amountLabel: string;
  isApproving: boolean;
  onApprove: () => void | Promise<void>;
};

function TokenIcon({ symbol }: { symbol: string }) {
  const label = symbol.trim() || "TOKEN";
  return (
    <Image
      src={getTokenIconSrc(label)}
      alt=""
      width={40}
      height={40}
      className="size-10 shrink-0 rounded-full ring-1 ring-border/60"
      unoptimized
    />
  );
}

export function ProfileDepositApproveDialog({
  open,
  onOpenChange,
  symbol,
  amountLabel,
  isApproving,
  onApprove,
}: Props) {
  const { t } = useI18n();
  const fullAmount = amountLabel.trim() || "0";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          "w-[calc(100%-2rem)] !max-w-md gap-0 rounded-2xl p-0 ring-1 ring-border/60",
          "max-h-[min(90vh,640px)] overflow-y-auto"
        )}
      >
        <div className="border-border/60 bg-brand/5 border-b px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand ring-1 ring-brand/20">
              <ShieldCheckIcon aria-hidden className="size-5" />
            </div>
            <AlertDialogHeader className="min-w-0 flex-1 !grid-cols-1 gap-1.5 text-left sm:place-items-start">
              <AlertDialogTitle className="text-lg font-semibold tracking-tight">
                {t("profile.depositApproveTitle")}
              </AlertDialogTitle>
            </AlertDialogHeader>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="bg-muted/50 border-border/60 flex items-center gap-3 rounded-2xl border p-3.5">
            <TokenIcon symbol={symbol} />
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs font-medium">
                {t("profile.depositApproveAmountLabel")}
              </p>
              <div className="mt-0.5 -mx-0.5 overflow-x-auto px-0.5">
                <div className="flex min-w-max items-baseline gap-2 whitespace-nowrap">
                  <span className="text-foreground font-mono text-sm font-semibold tabular-nums">
                    {fullAmount}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">{symbol}</span>
                </div>
              </div>
            </div>
          </div>

          <ol className="text-muted-foreground space-y-1.5 text-xs leading-relaxed">
            <li className="flex gap-2">
              <span className="bg-brand/15 text-brand flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
                1
              </span>
              <span>{t("profile.depositApproveStep1")}</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-1 ring-border/60">
                2
              </span>
              <span>{t("profile.depositApproveStep2")}</span>
            </li>
          </ol>
        </div>

        <AlertDialogFooter className="mx-0 mb-0 gap-2.5 border-t border-border/60 bg-muted/30 px-5 py-4 sm:flex-row sm:justify-stretch">
          <AlertDialogCancel
            variant="destructive"
            disabled={isApproving}
            className="h-11 w-full rounded-xl sm:flex-1"
          >
            {t("profile.depositApproveCancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isApproving}
            className="h-11 w-full rounded-xl sm:flex-1"
            onClick={(e) => {
              e.preventDefault();
              void onApprove();
            }}
          >
            {isApproving ? t("profile.depositApproving") : t("profile.depositApproveConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
