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
import { usePlacePerpsOrder } from "@/hooks/use-place-perps-order";
import {
  priceInputToX18,
  triggerDirectionAgainstPrice,
} from "@/lib/perps/conditional-order";
import { formatBaseQuantity, positionSizeAtPercent } from "@/lib/perps/positions-format";
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
  /** Exact `|balancePosition|` used as the order amount. */
  sizeRaw: bigint;
  enginePriceDecimal: number | null;
  leverage: number | null;
  minTradeAmount: bigint | null;
  /** List break-even at the moment the dialog opened. Later funding-index pushes do not replace it. */
  breakEvenPrice: number;
  /** Formatted last trade, or an em dash when the quote is not ready. */
  currentPrice: string;
  /** Plain last-trade decimal captured when the dialog opens. Empty when the quote is missing. */
  currentInput: string;
};

function sanitizeDecimal(raw: string): string {
  const next = raw.replace(/[^\d.]/g, "");
  const dot = next.indexOf(".");
  if (dot < 0) return next;
  return `${next.slice(0, dot + 1)}${next.slice(dot + 1).replace(/\./g, "").slice(0, 18)}`;
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

type CloseOrderMode = "limit" | "trigger";

function triggerPriceGuide(
  t: (path: string) => string,
  triggerRaw: string,
  currentRaw: string,
  enginePriceDecimal: number | null
): { note?: string; error?: string } {
  if (parsePositiveDecimal(triggerRaw) == null || enginePriceDecimal == null) return {};
  if (priceInputToX18(currentRaw, enginePriceDecimal) == null) {
    return { error: t("perps.closeNoCurrent") };
  }
  const direction = triggerDirectionAgainstPrice(triggerRaw, currentRaw, enginePriceDecimal);
  if (direction === 1) return { note: t("perps.triggerAbove") };
  if (direction === 2) return { note: t("perps.triggerBelow") };
  return { error: t("perps.triggerMustDiffer") };
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
  const { place, placeTpSl, pending } = usePlacePerpsOrder();
  const sizeError =
    draft.parsedSize != null && exceedsSize(draft.parsedSize, target.size)
      ? t("perps.exceedsPositionSize")
      : null;
  const triggerReady =
    draft.mode !== "trigger" ||
    (target.enginePriceDecimal != null &&
      triggerDirectionAgainstPrice(
        draft.triggerPrice,
        target.currentInput,
        target.enginePriceDecimal
      ) != null);

  return (
    <DialogContent
      className={cn(
        "flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
        "rounded-2xl ring-1 ring-border/60 sm:max-w-md"
      )}
    >
      <CloseHeader pairDisplay={target.pairDisplay} side={target.side} />
      <ClosePositionFields
        target={target}
        mode={draft.mode}
        closePrice={draft.closePrice}
        triggerPrice={draft.triggerPrice}
        sizeInput={draft.sizeInput}
        sizePct={draft.sizePct}
        sizeError={sizeError}
        positionSizeText={draft.positionSizeText}
        onModeChange={draft.setMode}
        onTriggerChange={(value) => draft.setTriggerPrice(sanitizeDecimal(value))}
        onPriceChange={(value) => draft.setClosePrice(sanitizeDecimal(value))}
        onSizeChange={(value) => {
          draft.setSizePct(0);
          draft.setSizeInput(sanitizeDecimal(value));
        }}
        onPctChange={draft.applyPercent}
      />
      <CloseFooter
        disabled={pending || draft.parsedSize == null || sizeError != null || !triggerReady}
        side={target.side}
        confirmLabel={
          pending
            ? t("perps.placingOrder")
            : draft.mode === "trigger"
              ? t("perps.closeWhenTriggered")
              : t("perps.closeNow")
        }
        onCancel={() => onOpenChange(false)}
        onConfirm={() => {
          if (target.side == null) {
            toast.error(t("perps.orderFailed"));
            return;
          }
          const order = {
            side: target.side === "buy" ? ("sell" as const) : ("buy" as const),
            price: draft.closePrice,
            quantity: draft.sizeInput,
            pairId: target.pairId,
            enginePriceDecimal: target.enginePriceDecimal,
            leverage: target.leverage,
            reduceOnly: 1 as const,
            minTrade: target.minTradeAmount,
            quoteSymbol: target.quoteSymbol,
          };
          const submit =
            draft.mode === "trigger"
              ? placeTpSl({
                  ...order,
                  triggerPrice: draft.triggerPrice,
                  currentPrice: target.currentInput,
                })
              : place(order);
          void submit.then((ok) => {
            if (ok) onOpenChange(false);
          });
        }}
      />
    </DialogContent>
  );
}

function useCloseDraft(target: ClosePositionTarget) {
  const [mode, setMode] = useState<CloseOrderMode>("limit");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [closePrice, setClosePrice] = useState(target.currentInput);
  const [sizeInput, setSizeInput] = useState(() => formatBaseQuantity(target.sizeRaw));
  const [sizePct, setSizePct] = useState(() => (target.sizeRaw > BigInt(0) ? 100 : 0));
  const parsedSize = useMemo(() => parsePositiveDecimal(sizeInput), [sizeInput]);
  const applyPercent = useCallback(
    (pct: number) => {
      setSizePct(pct);
      setSizeInput(positionSizeAtPercent(target.sizeRaw, pct));
    },
    [target]
  );
  const sizeText = formatBaseQuantity(target.sizeRaw);
  const positionSizeText = sizeText ? `${sizeText} ${target.baseSymbol}` : "—";

  return {
    mode,
    setMode,
    triggerPrice,
    setTriggerPrice,
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
    <div className="border-border/60 shrink-0 border-b px-5 pt-5 pb-4 pr-12">
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
  mode: CloseOrderMode;
  closePrice: string;
  triggerPrice: string;
  sizeInput: string;
  sizePct: number;
  sizeError: string | null;
  positionSizeText: string;
  onModeChange: (mode: CloseOrderMode) => void;
  onTriggerChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onSizeChange: (value: string) => void;
  onPctChange: (pct: number) => void;
};

function ClosePositionFields({
  target,
  mode,
  closePrice,
  triggerPrice,
  sizeInput,
  sizePct,
  sizeError,
  positionSizeText,
  onModeChange,
  onTriggerChange,
  onPriceChange,
  onSizeChange,
  onPctChange,
}: ClosePositionFieldsProps) {
  const { t } = useI18n();
  const triggerMode = mode === "trigger";
  const triggerGuide = triggerMode
    ? triggerPriceGuide(t, triggerPrice, target.currentInput, target.enginePriceDecimal)
    : {};
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
      <CloseModeSwitch mode={mode} onModeChange={onModeChange} />
      <PositionContext
        entryLabel={t("perps.breakEvenPrice")}
        entry={target.breakEvenPrice > 0 ? formatSubscriptPrice(target.breakEvenPrice, 8) : "—"}
        markLabel={t("perps.currentPrice")}
        mark={target.currentPrice}
        qtyLabel={t("perps.positionQty")}
        qty={positionSizeText}
      />
      {triggerMode ? (
        <PriceStepField
          id="close-position-trigger"
          label={t("perps.triggerPrice")}
          suffix={target.quoteSymbol}
          value={triggerPrice}
          note={triggerGuide.note}
          error={triggerGuide.error}
          onChange={onTriggerChange}
        />
      ) : null}
      <PriceStepField
        id="close-position-price"
        label={t("perps.closePrice")}
        suffix={target.quoteSymbol}
        value={closePrice}
        hint={triggerMode ? undefined : t("perps.limitCloseHint")}
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
      <CloseEstimate
        notionalLabel={t("perps.closeNotional")}
        notional={formatCloseNotional(closePrice, sizeInput)}
        pnlLabel={t("perps.estPnl")}
        pnl={formatClosePnl(target.side, target.breakEvenPrice, closePrice, sizeInput)}
        unit={target.quoteSymbol}
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
  valueClassName,
}: {
  label: string;
  value: string;
  muted?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-muted-foreground text-[11px] leading-none">{label}</p>
      <p
        className={cn(
          "mt-1.5 truncate text-sm font-medium tabular-nums",
          valueClassName ?? (muted ? "text-muted-foreground" : "text-foreground")
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CloseModeSwitch({
  mode,
  onModeChange,
}: {
  mode: CloseOrderMode;
  onModeChange: (mode: CloseOrderMode) => void;
}) {
  const { t } = useI18n();
  const options = [
    { id: "limit" as const, label: t("perps.closeModeLimit") },
    { id: "trigger" as const, label: t("perps.closeModeTrigger") },
  ];
  return (
    <div
      className="bg-muted grid h-9 grid-cols-2 rounded-lg p-0.5"
      role="radiogroup"
      aria-label={t("perps.closePosition")}
    >
      {options.map((option) => {
        const selected = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onModeChange(option.id)}
            className={cn(
              "rounded-md text-sm font-medium transition-colors duration-200",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function PriceStepField({
  id,
  label,
  suffix,
  value,
  hint,
  note,
  error,
  onChange,
}: {
  id: string;
  label: string;
  suffix: string;
  value: string;
  hint?: string;
  note?: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const noteId = note ? `${id}-note` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [noteId, errorId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-muted-foreground text-xs font-medium">
          {label}
        </Label>
        {note ? (
          <span id={noteId} className="text-foreground shrink-0 text-xs font-medium">
            {note}
          </span>
        ) : null}
      </div>
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
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
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
      {error ? (
        <p id={errorId} className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="text-muted-foreground text-xs leading-snug">
          {hint}
        </p>
      ) : null}
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

function CloseEstimate({
  notionalLabel,
  notional,
  pnlLabel,
  pnl,
  unit,
}: {
  notionalLabel: string;
  notional: string;
  pnlLabel: string;
  pnl: string;
  unit: string;
}) {
  return (
    <div className="border-input bg-background overflow-hidden rounded-xl border">
      <div className="grid grid-cols-2 divide-x divide-border/60">
        <QuoteStat
          label={notionalLabel}
          value={withUnit(notional, unit)}
          muted={notional === "—"}
        />
        <QuoteStat
          label={pnlLabel}
          value={withUnit(pnl, unit)}
          muted={pnl === "—"}
          valueClassName={pnlValueTone(pnl)}
        />
      </div>
    </div>
  );
}

function withUnit(value: string, unit: string): string {
  if (value === "—") return value;
  return `${value} ${unit}`;
}

function pnlValueTone(value: string): string | undefined {
  if (value.startsWith("+")) return "text-brand";
  if (value.startsWith("-")) return "text-brand-alt";
  return undefined;
}

function CloseFooter({
  disabled,
  side,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  disabled: boolean;
  side: ClosePositionTarget["side"];
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  return (
    <DialogFooter className="mx-0 mb-0 shrink-0 flex-col gap-2.5 rounded-b-2xl border-t border-border/60 bg-muted/30 px-5 py-4 sm:flex-row sm:justify-end">
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
        {confirmLabel}
      </Button>
    </DialogFooter>
  );
}
