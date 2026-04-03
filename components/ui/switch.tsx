"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  leadingIcon,
  trailingIcon,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
  /** 显示在滑轨左侧（如浅色 / 太阳） */
  leadingIcon?: React.ReactNode
  /** 显示在滑轨右侧（如深色 / 月亮） */
  trailingIcon?: React.ReactNode
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-6 data-[size=default]:w-14 data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {leadingIcon != null ? (
        <span
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-1.5 z-[1] -translate-y-1/2 opacity-80"
          aria-hidden
        >
          {leadingIcon}
        </span>
      ) : null}
      {trailingIcon != null ? (
        <span
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-1.5 z-[1] -translate-y-1/2 opacity-80"
          aria-hidden
        >
          {trailingIcon}
        </span>
      ) : null}
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none z-[2] block rounded-full bg-background ring-0 transition-transform dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground",
          "group-data-[size=default]/switch:size-5 group-data-[size=default]/switch:data-unchecked:translate-x-0.5 group-data-[size=default]/switch:data-checked:translate-x-[34px]",
          "group-data-[size=sm]/switch:size-3 group-data-[size=sm]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
