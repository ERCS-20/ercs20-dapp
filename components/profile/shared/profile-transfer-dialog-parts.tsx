"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { CopyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getTokenIconSrc } from "@/lib/tokens/icon-path";
import type { UserBalanceRsp } from "@/services/asset/types";
import { cn } from "@/lib/utils";

export function ProfileTransferTokenIcon({
  symbol,
  size = "md",
}: {
  symbol: string;
  size?: "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const label = symbol.trim() || "TOKEN";
  const sizeClass = size === "lg" ? "size-11 text-sm" : "size-10 text-xs";

  if (failed) {
    return (
      <span
        className={cn(
          "bg-muted text-foreground flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-border/60",
          sizeClass
        )}
        aria-hidden
      >
        {label.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={getTokenIconSrc(label)}
      alt=""
      width={size === "lg" ? 44 : 40}
      height={size === "lg" ? 44 : 40}
      className={cn("shrink-0 rounded-full ring-1 ring-border/60", sizeClass)}
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}

export function ProfileTransferSection({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-muted-foreground text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

export function ProfileTransferTokenSelect({
  id,
  balances,
  value,
  onChange,
  ariaLabel,
}: {
  id: string;
  balances: UserBalanceRsp[];
  value: string;
  onChange: (tokenAddress: string) => void;
  ariaLabel: string;
}) {
  const selected = balances.find((b) => b.tokenAddress === value);

  return (
    <div className="border-border/60 bg-muted/25 flex items-center gap-3 rounded-xl border p-3">
      {selected ? <ProfileTransferTokenIcon symbol={selected.symbol} size="lg" /> : null}
      <div className="min-w-0 flex-1">
        <select
          id={id}
          className="text-foreground w-full cursor-pointer appearance-none bg-transparent text-sm font-medium outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
        >
          {balances.map((row) => (
            <option key={row.tokenAddress} value={row.tokenAddress}>
              {row.symbol} — {row.name}
            </option>
          ))}
        </select>
        {selected ? (
          <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
            {selected.tokenAddress}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ProfileTransferAmountInput({
  id,
  symbol,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  symbol: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="border-border/60 bg-background focus-within:border-ring focus-within:ring-ring/50 rounded-xl border px-3 py-2.5 transition-colors focus-within:ring-3">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-lg font-medium tabular-nums outline-none"
        />
        <span className="text-muted-foreground shrink-0 text-sm font-medium">{symbol}</span>
      </div>
    </div>
  );
}

export function ProfileTransferAddressBlock({
  id,
  label,
  value,
  hint,
  onCopy,
  copyLabel,
  truncate = false,
  tone = "neutral",
}: {
  id: string;
  label: string;
  value: string;
  hint?: string;
  onCopy?: () => void;
  copyLabel?: string;
  truncate?: boolean;
  tone?: "neutral" | "brand" | "brand-alt";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed p-3.5",
        tone === "brand"
          ? "border-brand/20 bg-brand/5"
          : tone === "brand-alt"
            ? "border-brand-alt/20 bg-brand-alt/5"
            : "border-border/60 bg-muted/20"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        {onCopy && value ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2"
            aria-label={copyLabel}
            onClick={onCopy}
          >
            <CopyIcon className="size-3.5" aria-hidden />
            {copyLabel}
          </Button>
        ) : null}
      </div>
      <p
        id={id}
        className={cn(
          "text-foreground font-mono text-xs leading-relaxed",
          truncate ? "truncate" : "break-all"
        )}
        title={value}
      >
        {value || "—"}
      </p>
      {hint ? <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{hint}</p> : null}
    </div>
  );
}

export function ProfileTransferBalanceHint({
  label,
  amount,
  symbol,
  tone = "brand",
}: {
  label: string;
  amount: string;
  symbol: string;
  tone?: "brand" | "brand-alt";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5",
        tone === "brand"
          ? "border-brand/20 bg-brand/5"
          : "border-brand-alt/20 bg-brand-alt/5"
      )}
    >
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={cn(
          "tabular-nums text-sm font-medium",
          tone === "brand" ? "text-brand" : "text-brand-alt"
        )}
      >
        {amount} {symbol}
      </span>
    </div>
  );
}
