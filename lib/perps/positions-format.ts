import { formatOrderFee, formatOrderQuantity } from "@/lib/market/open-orders-format";
import { pairLabelFromCode, parsePairCode } from "@/lib/market/pair";
import { parseApiBigInt, type ApiBigInt } from "@/lib/utils/coerce-bigint";
import type { MarketFundingIndex } from "@/services/perps/market/types";
import type { PositionHistoryRsp, PositionsRsp } from "@/services/perps/orders/types";

const WAD = BigInt(10) ** BigInt(18);

export type PositionFundingQuote = {
  /** Latest `fundingIndex` push. A newer timestamp adds unsettled funding to margin, liq, PnL, and break-even. */
  fundingIndex?: MarketFundingIndex | null;
  minCollateralX18?: ApiBigInt | null;
  /** Quote/base × 1e18. Missing or ≤ 0 leaves PnL unset. */
  markX18?: ApiBigInt | null;
};

export type PositionRow = {
  id: string;
  account: string;
  pairId: number;
  pairLabel: string;
  quoteSymbol: string;
  side: "buy" | "sell" | null;
  /** Chain `balanceMargin`, without unsettled funding. */
  balanceMargin: bigint;
  /** Display margin, including unsettled funding when the global index is newer. */
  margin: number;
  /** `|balancePosition|` (base size, 18 decimals). */
  size: number;
  /** Round break-even, including unsettled funding. `0` when missing. See `docs/perps-position.md`. */
  breakEvenPrice: number;
  liqPrice: number;
  leverage: number | null;
  /** Quote PnL. Null when the mark price is not available. */
  pnl: number | null;
  /** Percent. Null when the mark price is not available. `0` when capital ≤ 0. */
  roiPct: number | null;
  openedAt: number;
  closedAt?: number;
};

/** `liqPrice` is quote-per-base × 1e18. */
export function priceX18ToNumber(raw: ApiBigInt): number {
  const bi = parseApiBigInt(raw) ?? BigInt(0);
  if (bi === BigInt(0)) return 0;
  return Number(bi) / 10 ** 18;
}

function apiInt(raw: ApiBigInt | undefined): bigint {
  return parseApiBigInt(raw) ?? BigInt(0);
}

/** Settled display margin, before an unsettled funding index is applied. */
export function positionDisplayMargin(pos: PositionsRsp): bigint {
  return (
    apiInt(pos.totalTradeMargin) -
    apiInt(pos.totalTradeFee) +
    apiInt(pos.totalMarginAdjust) +
    apiInt(pos.totalFunding)
  );
}

function fundingIndexIsNewer(pos: PositionsRsp, index: MarketFundingIndex | null | undefined): boolean {
  if (index == null) return false;
  const globalTs = parseApiBigInt(index.timestamp);
  if (globalTs == null) return false;
  return BigInt(pos.fundingTimestamp ?? 0) < globalTs;
}

/** Pending funding when the global index timestamp is ahead of this position. */
export function unsettledFunding(
  pos: PositionsRsp,
  index: MarketFundingIndex | null | undefined
): bigint {
  if (!fundingIndexIsNewer(pos, index) || index == null) return BigInt(0);
  const globalValue = parseApiBigInt(index.value);
  if (globalValue == null) return BigInt(0);
  const indexDelta = globalValue - apiInt(pos.fundingValue);
  const position = apiInt(pos.balancePosition);
  return -((indexDelta * position) / WAD);
}

function openNotional(position: bigint, margin: bigint, balanceMargin: bigint): bigint {
  if (position === BigInt(0)) return BigInt(0);
  const notional = position > BigInt(0) ? margin - balanceMargin : balanceMargin - margin;
  return notional > BigInt(0) ? notional : BigInt(0);
}

function positionPnl(
  pos: PositionsRsp,
  balanceMargin: bigint,
  markX18: ApiBigInt | null | undefined
): { pnl: number; roiPct: number } | null {
  const mark = parseApiBigInt(markX18);
  if (mark == null || mark <= BigInt(0)) return null;
  const position = apiInt(pos.balancePosition);
  const absPosition = position < BigInt(0) ? -position : position;
  const markQuote = (absPosition * mark) / WAD;
  const equity = position < BigInt(0) ? balanceMargin - markQuote : balanceMargin + markQuote;
  const tradeMargin = apiInt(pos.totalTradeMargin);
  const marginAdjust = apiInt(pos.totalMarginAdjust);
  const pnl = equity - tradeMargin - marginAdjust;
  const capital = tradeMargin + marginAdjust;
  const roiBasisPoints = capital <= BigInt(0) ? BigInt(0) : (pnl * BigInt(10000)) / capital;
  return {
    pnl: formatOrderFee(pnl.toString()),
    roiPct: Number(roiBasisPoints) / 100,
  };
}

function leverageOf(notional: bigint, margin: bigint): number | null {
  if (margin <= BigInt(0) || notional <= BigInt(0)) return null;
  const leverage = Number(notional / margin);
  return Number.isFinite(leverage) && leverage > 0 ? leverage : null;
}

/**
 * Quote notional that zeros this round's PnL.
 * `balanceMargin` already includes unsettled funding. Capital does not, so a newer funding index moves this price.
 * See `docs/perps-position.md`.
 */
function breakEvenNotional(
  position: bigint,
  tradeMargin: bigint,
  marginAdjust: bigint,
  balanceMargin: bigint
): bigint {
  if (position === BigInt(0)) return BigInt(0);
  const capital = tradeMargin + marginAdjust;
  const notional = position > BigInt(0) ? capital - balanceMargin : balanceMargin - capital;
  return notional > BigInt(0) ? notional : BigInt(0);
}

/** Break-even price: notional / `|balancePosition|`. `0` when either is missing. */
export function positionBreakEvenPrice(position: bigint, notional: bigint): number {
  const absPosition = position < BigInt(0) ? -position : position;
  if (absPosition === BigInt(0) || notional <= BigInt(0)) return 0;
  return priceX18ToNumber((notional * WAD) / absPosition);
}

/** Backend `PositionsService.calcLiqPrice`. Returns × 1e18, or null when collateral is missing. */
function calcLiqPriceX18(margin: bigint, position: bigint, minCollateralX18: ApiBigInt | null | undefined): bigint | null {
  const minCollateral = parseApiBigInt(minCollateralX18);
  if (minCollateral == null || minCollateral <= BigInt(0)) return null;
  if (position === BigInt(0)) return BigInt(0);
  if (position > BigInt(0) && margin < BigInt(0)) {
    return (-margin * minCollateral) / position;
  }
  if (position < BigInt(0) && margin > BigInt(0)) {
    return (margin * WAD * WAD) / (-position * minCollateral);
  }
  return BigInt(0);
}

export function positionsRspToRow(pos: PositionsRsp, quote?: PositionFundingQuote): PositionRow {
  const position = apiInt(pos.balancePosition);
  const side: PositionRow["side"] =
    position > BigInt(0) ? "buy" : position < BigInt(0) ? "sell" : null;
  const unsettled = unsettledFunding(pos, quote?.fundingIndex);
  const marginBi = positionDisplayMargin(pos) + unsettled;
  const balanceWithUnsettled = apiInt(pos.balanceMargin) + unsettled;
  const chainLiq = priceX18ToNumber(pos.liqPrice);
  const recalc = fundingIndexIsNewer(pos, quote?.fundingIndex)
    ? calcLiqPriceX18(balanceWithUnsettled, position, quote?.minCollateralX18)
    : null;
  const pnl = positionPnl(pos, balanceWithUnsettled, quote?.markX18);
  return {
    id: String(pos.id),
    account: pos.account,
    pairId: pos.pairId,
    pairLabel: pairLabelFromCode(pos.pairCode),
    quoteSymbol: parsePairCode(pos.pairCode)?.quote ?? "USDC",
    side,
    balanceMargin: apiInt(pos.balanceMargin),
    margin: formatOrderFee(marginBi.toString()),
    size: formatOrderQuantity((position < BigInt(0) ? -position : position).toString()),
    breakEvenPrice: positionBreakEvenPrice(
      position,
      breakEvenNotional(
        position,
        apiInt(pos.totalTradeMargin),
        apiInt(pos.totalMarginAdjust),
        balanceWithUnsettled
      )
    ),
    liqPrice: recalc == null ? chainLiq : priceX18ToNumber(recalc),
    leverage: leverageOf(openNotional(position, marginBi, balanceWithUnsettled), marginBi),
    pnl: pnl?.pnl ?? null,
    roiPct: pnl?.roiPct ?? null,
    openedAt: pos.openedAt,
    closedAt: pos.closedAt ?? undefined,
  };
}

export type PositionHistoryRow = {
  key: string;
  /** Same as live `positions.id`. */
  id: string;
  account: string;
  pairId: number;
  pairLabel: string;
  totalTradeMargin: number;
  totalTradeFee: number;
  totalMarginAdjust: number;
  totalFunding: number;
  totalMarginSettled: number;
  realizedPnl: number;
  /** Percent, e.g. 12.5 = 12.5%. */
  roiPct: number;
  openedAt: number;
  closedAt: number;
};

export function positionHistoryRspToRow(
  row: PositionHistoryRsp,
  index: number
): PositionHistoryRow {
  return {
    key: `${row.id}-${row.pairId}-${row.closedAt}-${index}`,
    id: String(row.id),
    account: row.account,
    pairId: row.pairId,
    pairLabel: pairLabelFromCode(row.pairCode),
    totalTradeMargin: formatOrderFee(row.totalTradeMargin),
    totalTradeFee: formatOrderFee(row.totalTradeFee),
    totalMarginAdjust: formatOrderFee(row.totalMarginAdjust),
    totalFunding: formatOrderFee(row.totalFunding),
    totalMarginSettled: formatOrderFee(row.totalMarginSettled),
    realizedPnl: formatOrderFee(row.realizedPnl),
    roiPct: priceX18ToNumber(row.roi) * 100,
    openedAt: row.openedAt,
    closedAt: row.closedAt,
  };
}
