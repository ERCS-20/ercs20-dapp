"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { SizePctControls } from "@/components/trading/size-pct-controls";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatQuoteAmount, formatSubscriptPrice } from "@/lib/utils/price";
import { useI18n } from "@/providers/i18n-provider";

export type ClosePositionTarget = {
  /** Selected row Pair column, including leverage suffix. */
  pairDisplay: string;
  pairId: number;
  quoteSymbol: string;
  baseSymbol: string;
  side: "buy" | "sell" | null;
  /** Size (base token) from the selected row. */
  size: number;
  /** List break-even at the moment the dialog opened. Later funding-index pushes do not replace it. */
  breakEvenPrice: number;
  /** Formatted mark, or an em dash when the quote is not ready. */
  markPrice: string;
  /** Plain mark decimal captured when the dialog opens. Empty when the quote is missing. */
  markInput: string;
};

function sanitizeDecimal(raw: string): string {
  const next = raw.replace(/[^\d.]/g, "");
  const dot = next.indexOf(".");
  if (dot < 0) return next;
  return `${next.slice(0, dot + 1)}${next.slice(dot + 1).replace(/\./g, "").slice(0, 18)}`;
}

function trimTrailingZeros(value: string): string {
  if (!value.includes(".")) return value;
  return value.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
}

function formatSizeInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return trimTrailingZeros(value.toFixed(8));
}

function parsePositiveDecimal(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === ".") return undefined;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

function exceedsSize(amount: number, max: number): boolean {
  return amount - max > 1e-8;
}

function fractionDigits(raw: string): number {
  const dot = raw.indexOf(".");
  if (dot < 0) return 0;
  return Math.min(raw.length - dot - 1, 18);
}

/** Step by the last decimal place of the current text. Empty starts at 1. */
function nudgeClosePrice(raw: string, direction: 1 | -1): string {
  const digits = fractionDigits(raw);
  const factor = 10 ** digits;
  const current = raw === "" || raw === "." ? 0 : Number(raw);
  if (!Number.isFinite(current)) return raw;
  const units = Math.round(current * factor) + direction;
  if (units <= 0) return raw;
  if (digits === 0) return String(units);
  return (units / factor).toFixed(digits);
}

function canDecreasePrice(raw: string): boolean {
  const current = Number(raw);
  if (!Number.isFinite(current) || current <= 0) return false;
  const factor = 10 ** fractionDigits(raw);
  return Math.round(current * factor) > 1;
}

function closeFormKey(target: ClosePositionTarget): string {
  return `${target.pairId}:${target.size}`;
}

function confirmTone(side: ClosePositionTarget["side"]): string {
  if (side === "buy") return "bg-brand-alt text-brand-alt-on hover:bg-brand-alt/90";
  if (side === "sell") return "bg-brand text-brand-on hover:bg-brand/90";
  return "";
}

export function PerpsClosePositionDialog({
  target,
  onOpenChange,
}: {
  target: ClosePositionTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={target != null} onOpenChange={onOpenChange}>
      {target ? (
        <ClosePositionForm
          key={closeFormKey(target)}
          target={target}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </Dialog>
  );
}

function ClosePositionForm({
  target,
  onOpenChange,
}: {
  target: ClosePositionTarget;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const draft = useCloseDraft(target);
  const sizeError =
    draft.parsedSize != null && exceedsSize(draft.parsedSize, target.size)
      ? t("perps.exceedsPositionSize")
      : null;

  return (
    <DialogContent
      className={cn(
        "flex max-h-[min(90vh,760px)] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
        "rounded-2xl ring-1 ring-border/60 sm:max-w-md"
      )}
    >
      <CloseHeader pairDisplay={target.pairDisplay} side={target.side} />
      <ClosePositionFields
        target={target}
        closePrice={draft.closePrice}
        sizeInput={draft.sizeInput}
        sizePct={draft.sizePct}
        sizeError={sizeError}
        positionSizeText={draft.positionSizeText}
        onPriceChange={(value) => draft.setClosePrice(sanitizeDecimal(value))}
        onSizeChange={(value) => {
          draft.setSizePct(0);
          draft.setSizeInput(sanitizeDecimal(value));
        }}
        onPctChange={draft.applyPercent}
      />
      <CloseFooter
        disabled={draft.parsedSize == null || sizeError != null}
        side={target.side}
        onCancel={() => onOpenChange(false)}
        onConfirm={() => toast.info(t("perps.positionActionComingSoon"))}
      />
    </DialogContent>
  );
}

function useCloseDraft(target: ClosePositionTarget) {
  const [closePrice, setClosePrice] = useState(target.markInput);
  const [sizeInput, setSizeInput] = useState(() =>
    target.size > 0 ? formatSizeInput(target.size) : ""
  );
  const [sizePct, setSizePct] = useState(() => (target.size > 0 ? 100 : 0));
  const parsedSize = useMemo(() => parsePositiveDecimal(sizeInput), [sizeInput]);
  const applyPercent = useCallback(
    (pct: number) => {
      setSizePct(pct);
      if (pct < 1 || !(target.size > 0)) {
        setSizeInput("");
        return;
      }
      setSizeInput(formatSizeInput((target.size * pct) / 100));
    },
    [target]
  );
  const positionSizeText =
    target.size > 0 ? `${formatSizeInput(target.size)} ${target.baseSymbol}` : "—";

  return {
    closePrice,
    setClosePrice,
    sizeInput,
    setSizeInput,
    sizePct,
    setSizePct,
    parsedSize,
    applyPercent,
    positionSizeText,
  };
}

function CloseHeader({
  pairDisplay,
  side,
}: {
  pairDisplay: string;
  side: ClosePositionTarget["side"];
}) {
  const { t } = useI18n();
  return (
    <div className="border-border/60 border-b px-5 pt-5 pb-4 pr-12">
      <DialogHeader className="gap-2 text-left">
        <DialogTitle className="text-base font-semibold tracking-tight">
          {t("perps.closePosition")}
        </DialogTitle>
        <DialogDescription className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-xs">{t("perps.contract")}</span>
          <span className="text-foreground min-w-0 truncate font-semibold tracking-tight">
            {pairDisplay}
          </span>
          <SideBadge side={side} />
        </DialogDescription>
      </DialogHeader>
    </div>
  );
}

function SideBadge({ side }: { side: ClosePositionTarget["side"] }) {
  const { t } = useI18n();
  if (side !== "buy" && side !== "sell") return null;
  const isLong = side === "buy";
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-md px-1.5 text-[11px] font-semibold",
        isLong ? "bg-brand/15 text-brand" : "bg-brand-alt/15 text-brand-alt"
      )}
    >
      {isLong ? t("perps.long") : t("perps.short")}
    </span>
  );
}

type ClosePositionFieldsProps = {
  target: ClosePositionTarget;
  closePrice: string;
  sizeInput: string;
  sizePct: number;
  sizeError: string | null;
  positionSizeText: string;
  onPriceChange: (value: string) => void;
  onSizeChange: (value: string) => void;
  onPctChange: (pct: number) => void;
};

function ClosePositionFields({
  target,
  closePrice,
  sizeInput,
  sizePct,
  sizeError,
  positionSizeText,
  onPriceChange,
  onSizeChange,
  onPctChange,
}: ClosePositionFieldsProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
      <PositionContext
        entryLabel={t("perps.breakEvenPrice")}
        entry={target.breakEvenPrice > 0 ? formatSubscriptPrice(target.breakEvenPrice, 8) : "—"}
        markLabel={t("perps.markPrice")}
        mark={target.markPrice}
        qtyLabel={t("perps.positionQty")}
        qty={positionSizeText}
      />
      <PriceStepField
        id="close-position-price"
        label={t("perps.closePrice")}
        suffix={target.quoteSymbol}
        value={closePrice}
        onChange={onPriceChange}
      />
      <AmountField
        id="close-position-size"
        label={t("perps.size")}
        suffix={target.baseSymbol}
        value={sizeInput}
        invalid={sizeError != null}
        error={sizeError}
        onChange={onSizeChange}
      >
        <SizePctControls
          pct={sizePct}
          onPctChange={onPctChange}
          disabled={!(target.size > 0)}
          side={target.side === "sell" ? "buy" : "sell"}
        />
      </AmountField>
      <EstimateRow
        label={`${t("perps.closeNotional")} (${target.quoteSymbol})`}
        value={formatCloseNotional(closePrice, sizeInput)}
      />
      <EstimateRow
        label={`${t("perps.estPnl")} (${target.quoteSymbol})`}
        value={formatClosePnl(target.side, target.breakEvenPrice, closePrice, sizeInput)}
        signed
      />
    </div>
  );
}

function PositionContext({
  entryLabel,
  entry,
  markLabel,
  mark,
  qtyLabel,
  qty,
}: {
  entryLabel: string;
  entry: string;
  markLabel: string;
  mark: string;
  qtyLabel: string;
  qty: string;
}) {
  const qtyMuted = qty === "—";
  return (
    <div className="border-input bg-background overflow-hidden rounded-xl border">
      <div className="grid grid-cols-2 divide-x divide-border/60">
        <QuoteStat label={entryLabel} value={entry} muted={entry === "—"} />
        <QuoteStat label={markLabel} value={mark} muted={mark === "—"} />
      </div>
      <div className="border-border/60 flex items-baseline justify-between gap-4 border-t px-4 py-2.5">
        <span className="text-muted-foreground shrink-0 text-xs">{qtyLabel}</span>
        <span
          className={cn(
            "min-w-0 truncate text-sm tabular-nums",
            qtyMuted ? "text-muted-foreground" : "text-foreground font-medium"
          )}
        >
          {qty}
        </span>
      </div>
    </div>
  );
}

function QuoteStat({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-muted-foreground text-[11px] leading-none">{label}</p>
      <p
        className={cn(
          "mt-1.5 truncate text-sm font-medium tabular-nums",
          muted ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PriceStepField({
  id,
  label,
  suffix,
  value,
  onChange,
}: {
  id: string;
  label: string;
  suffix: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      <div className="border-input bg-background flex h-11 items-center overflow-hidden rounded-xl border">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-11 shrink-0 rounded-none"
          disabled={!canDecreasePrice(value)}
          onClick={() => onChange(nudgeClosePrice(value, -1))}
          aria-label="-"
        >
          <MinusIcon className="size-4" />
        </Button>
        <div className="relative min-w-0 flex-1">
          <Input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 border-0 bg-transparent pr-16 shadow-none tabular-nums focus-visible:ring-0"
          />
          <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium">
            {suffix}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-11 shrink-0 rounded-none"
          onClick={() => onChange(nudgeClosePrice(value, 1))}
          aria-label="+"
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function AmountField({
  id,
  label,
  suffix,
  value,
  invalid = false,
  error,
  onChange,
  children,
}: {
  id: string;
  label: string;
  suffix: string;
  value: string;
  invalid?: boolean;
  error?: string | null;
  onChange: (value: string) => void;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-xl pr-16 tabular-nums"
        />
        <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium">
          {suffix}
        </span>
      </div>
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
      {children}
    </div>
  );
}

function formatCloseNotional(priceRaw: string, sizeRaw: string): string {
  const price = parsePositiveDecimal(priceRaw);
  const size = parsePositiveDecimal(sizeRaw);
  if (price == null || size == null) return "—";
  return formatQuoteAmount(price * size);
}

function closePnlAmount(
  side: ClosePositionTarget["side"],
  breakEvenPrice: number,
  priceRaw: string,
  sizeRaw: string
): number | null {
  const price = parsePositiveDecimal(priceRaw);
  const size = parsePositiveDecimal(sizeRaw);
  if (price == null || size == null || !(breakEvenPrice > 0)) return null;
  if (side === "buy") return (price - breakEvenPrice) * size;
  if (side === "sell") return (breakEvenPrice - price) * size;
  return null;
}

function formatClosePnl(
  side: ClosePositionTarget["side"],
  breakEvenPrice: number,
  priceRaw: string,
  sizeRaw: string
): string {
  const pnl = closePnlAmount(side, breakEvenPrice, priceRaw, sizeRaw);
  if (pnl == null || !Number.isFinite(pnl)) return "—";
  const abs = formatQuoteAmount(Math.abs(pnl));
  if (pnl > 0) return `+${abs}`;
  if (pnl < 0) return `-${abs}`;
  return abs;
}

function EstimateRow({
  label,
  value,
  signed = false,
}: {
  label: string;
  value: string;
  signed?: boolean;
}) {
  const pending = value === "—";
  const valueTone = pending
    ? "text-muted-foreground"
    : signed && value.startsWith("+")
      ? "text-brand"
      : signed && value.startsWith("-")
        ? "text-brand-alt"
        : "text-foreground";
  return (
    <div className="border-input bg-background flex items-center justify-between gap-4 rounded-xl border px-4 py-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn("text-sm font-medium tabular-nums", valueTone)}>{value}</span>
    </div>
  );
}

function CloseFooter({
  disabled,
  side,
  onCancel,
  onConfirm,
}: {
  disabled: boolean;
  side: ClosePositionTarget["side"];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  return (
    <DialogFooter className="mx-0 mb-0 flex-col gap-2.5 rounded-b-2xl border-t border-border/60 bg-muted/30 px-5 py-4 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl sm:w-auto sm:min-w-28"
        onClick={onCancel}
      >
        {t("perps.close")}
      </Button>
      <Button
        type="button"
        className={cn(
          "h-11 w-full rounded-xl font-semibold sm:w-auto sm:min-w-36",
          confirmTone(side)
        )}
        disabled={disabled}
        onClick={onConfirm}
      >
        {t("perps.confirmClosePosition")}
      </Button>
    </DialogFooter>
  );
}
