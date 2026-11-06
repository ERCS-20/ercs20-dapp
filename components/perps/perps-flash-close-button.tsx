"use client";

import type { ReactNode } from "react";
import { CircleHelpIcon } from "lucide-react";
import { Tooltip as TooltipPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export function FlashCloseTooltipProvider({ children }: { children: ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={250}>{children}</TooltipPrimitive.Provider>;
}

export function FlashCloseButton({
  label,
  hint,
  disabled,
  onClick,
}: {
  label: string;
  hint: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>
        <button
          type="button"
          aria-disabled={disabled || undefined}
          onClick={() => {
            if (disabled) return;
            onClick();
          }}
          className={cn(
            "border-border text-brand hover:bg-muted/50 hover:text-brand/80 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {label}
          <CircleHelpIcon className="size-3 opacity-70" aria-hidden />
        </button>
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top"
          align="end"
          sideOffset={6}
          className="border-border bg-popover text-popover-foreground z-50 max-w-64 rounded-lg border px-3 py-2 text-left text-xs leading-snug shadow-md"
        >
          {hint}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
