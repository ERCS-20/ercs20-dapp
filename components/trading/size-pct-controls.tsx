"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/providers/i18n-provider";

const PRESETS = [25, 50, 75, 100] as const;

export function SizePctControls({
  pct,
  onPctChange,
  disabled = false,
  side = "buy",
  className,
}: {
  pct: number;
  onPctChange: (pct: number) => void;
  disabled?: boolean;
  side?: "buy" | "sell";
  className?: string;
}) {
  const { t } = useI18n();

  return (
    <div className={cn("space-y-1", className)}>
      <div className="text-muted-foreground flex justify-between text-xs">
        <span>{t("spot.sizePct")}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        disabled={disabled}
        data-side={side}
        onChange={(e) => onPctChange(Number(e.target.value))}
        className="spot-size-slider w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={t("spot.sizePct")}
      />
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <Button
            key={p}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-7 flex-1 rounded-lg text-[11px]"
            onClick={() => onPctChange(p)}
          >
            {p}%
          </Button>
        ))}
      </div>
    </div>
  );
}
