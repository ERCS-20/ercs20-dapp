"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DEFAULT_DEADLINE_MINUTES,
  DEFAULT_SLIPPAGE_BPS,
} from "@/hooks/use-swap-settings";
import { useI18n } from "@/providers/i18n-provider";

function SwapSettingsDraft({
  slippageBps,
  deadlineMinutes,
  onSave,
  onClose,
}: {
  slippageBps: number;
  deadlineMinutes: number;
  onSave: (slippageBps: number, deadlineMinutes: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [bps, setBps] = useState(String(slippageBps));
  const [mins, setMins] = useState(String(deadlineMinutes));

  return (
    <>
      <SheetHeader className="mb-4 p-0 text-left">
        <SheetTitle className="text-lg">{t("swap.settings")}</SheetTitle>
      </SheetHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="swap-slippage-bps">{t("swap.slippage")}</Label>
          <Input
            id="swap-slippage-bps"
            inputMode="numeric"
            value={bps}
            onChange={(e) => setBps(e.target.value.replace(/[^\d]/g, ""))}
            placeholder={String(DEFAULT_SLIPPAGE_BPS)}
            className="h-10"
          />
          <p className="text-muted-foreground text-xs">{t("swap.slippageBpsHint")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="swap-deadline">{t("swap.deadline")}</Label>
          <Input
            id="swap-deadline"
            inputMode="numeric"
            value={mins}
            onChange={(e) => setMins(e.target.value.replace(/[^\d]/g, ""))}
            placeholder={String(DEFAULT_DEADLINE_MINUTES)}
            className="h-10"
          />
          <p className="text-muted-foreground text-xs">{t("swap.deadlineHint")}</p>
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            let nextBps = Number.parseInt(bps, 10);
            if (!Number.isFinite(nextBps)) nextBps = DEFAULT_SLIPPAGE_BPS;
            nextBps = Math.min(5000, Math.max(0, nextBps));
            let nextM = Number.parseInt(mins, 10);
            if (!Number.isFinite(nextM)) nextM = DEFAULT_DEADLINE_MINUTES;
            nextM = Math.min(24 * 60, Math.max(1, nextM));
            onSave(nextBps, nextM);
            onClose();
          }}
        >
          {t("swap.saveSettings")}
        </Button>
      </div>
    </>
  );
}

type Props = {
  mountKey: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slippageBps: number;
  deadlineMinutes: number;
  onSave: (slippageBps: number, deadlineMinutes: number) => void;
};

export function SwapSettingsSheet({
  mountKey,
  open,
  onOpenChange,
  slippageBps,
  deadlineMinutes,
  onSave,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="border-t px-4 pb-6 pt-3 sm:max-w-none"
        showCloseButton
      >
        <SwapSettingsDraft
          key={mountKey}
          slippageBps={slippageBps}
          deadlineMinutes={deadlineMinutes}
          onSave={onSave}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
