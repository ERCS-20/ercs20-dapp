"use client";

import type { SpotSide } from "@/lib/spot/types";
import { cn } from "@/lib/utils";

export function SpotSideSwitch({
  side,
  onSideChange,
  buyLabel,
  sellLabel,
  className,
}: {
  side: SpotSide;
  onSideChange: (s: SpotSide) => void;
  buyLabel: string;
  sellLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-input relative grid h-10 grid-cols-2 rounded-lg p-0.5",
        className
      )}
      role="group"
      aria-label={`${buyLabel} / ${sellLabel}`}
    >
      <div
        aria-hidden
        className={cn(
          "absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-md transition-transform duration-200 ease-out",
          side === "buy" ? "translate-x-0 bg-brand" : "translate-x-full bg-brand-alt"
        )}
      />
      <button
        type="button"
        aria-pressed={side === "buy"}
        onClick={() => onSideChange("buy")}
        className={cn(
          "relative z-10 rounded-md text-sm font-semibold transition-colors",
          side === "buy" ? "text-brand-on" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {buyLabel}
      </button>
      <button
        type="button"
        aria-pressed={side === "sell"}
        onClick={() => onSideChange("sell")}
        className={cn(
          "relative z-10 rounded-md text-sm font-semibold transition-colors",
          side === "sell" ? "text-brand-alt-on" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {sellLabel}
      </button>
    </div>
  );
}
