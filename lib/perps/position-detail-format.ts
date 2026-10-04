import { formatOrderFee } from "@/lib/market/open-orders-format";
import { formatUtcDateTime } from "@/lib/utils/format/datetime";
import { formatQuoteAmount } from "@/lib/utils/price";
import type {
  FundingSettlementsRsp,
  PositionCashLedgerRsp,
  PositionMarginEventsRsp,
} from "@/services/perps/orders/types";

const LEDGER_TYPE_KEYS: Record<string, string> = {
  TradeMargin: "perps.ledgerTradeMargin",
  TradeFee: "perps.ledgerTradeFee",
  Funding: "perps.ledgerFunding",
  MarginAdd: "perps.ledgerMarginAdd",
  MarginWithdraw: "perps.ledgerMarginWithdraw",
  MarginSettled: "perps.ledgerMarginSettled",
};

export function positionEventTypeLabel(
  t: (key: string) => string,
  raw: string
): string {
  const key = LEDGER_TYPE_KEYS[raw];
  if (!key) return raw || "—";
  return t(key);
}

export function formatSignedQuote(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = formatQuoteAmount(Math.abs(value));
  if (value > 0) return `+${abs}`;
  if (value < 0) return `-${abs}`;
  return abs;
}

export function signedAmountClass(value: number): string {
  if (value > 0) return "text-brand";
  if (value < 0) return "text-brand-alt";
  return "text-muted-foreground";
}

/** On-chain seconds or Jackson ms. */
export function formatEpochDateTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  const ms = value < 1e12 ? value * 1000 : value;
  return formatUtcDateTime(ms);
}

export function cashLedgerAmount(row: PositionCashLedgerRsp): number {
  return formatOrderFee(row.amount);
}

export function marginEventAmount(row: PositionMarginEventsRsp): number {
  return formatOrderFee(row.amount);
}

export function fundingPaymentAmount(row: FundingSettlementsRsp): number {
  return formatOrderFee(row.margin);
}

export function fundingPeriodLabel(row: FundingSettlementsRsp): string {
  const start = formatEpochDateTime(row.startTimestamp);
  const end = formatEpochDateTime(row.endTimestamp);
  if (start === "—" && end === "—") return "—";
  return `${start} → ${end}`;
}
