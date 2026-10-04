import { formatOrderFee } from "@/lib/market/open-orders-format";
import { pairLabelFromCode } from "@/lib/market/pair";
import { parseApiBigInt, type ApiBigInt } from "@/lib/utils/coerce-bigint";
import type { PositionHistoryRsp, PositionsRsp } from "@/services/perps/orders/types";

export type PositionRow = {
  id: string;
  pairLabel: string;
  side: "buy" | "sell" | null;
  /** `totalTradeMargin − totalTradeFee + totalMarginAdjust`. */
  margin: number;
  /** Open quote notional reconstructed from ledger. */
  total: number;
  liqPrice: number;
  leverage: number | null;
  openedAt: number;
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

/**
 * Display margin: `totalTradeMargin − totalTradeFee + totalMarginAdjust`.
 */
export function positionDisplayMargin(pos: PositionsRsp): bigint {
  return apiInt(pos.totalTradeMargin) - apiInt(pos.totalTradeFee) + apiInt(pos.totalMarginAdjust);
}

/**
 * Approximate open quote notional from cash ledger:
 * long:  margin − balanceMargin + funding
 * short: balanceMargin − margin − funding
 */
export function positionOpenNotional(pos: PositionsRsp): bigint {
  const position = apiInt(pos.balancePosition);
  if (position === BigInt(0)) return BigInt(0);
  const margin = positionDisplayMargin(pos);
  const balanceMargin = apiInt(pos.balanceMargin);
  const funding = apiInt(pos.totalFunding);
  const notional =
    position > BigInt(0)
      ? margin - balanceMargin + funding
      : balanceMargin - margin - funding;
  return notional > BigInt(0) ? notional : BigInt(0);
}

export function positionsRspToRow(pos: PositionsRsp): PositionRow {
  const position = apiInt(pos.balancePosition);
  const side: PositionRow["side"] =
    position > BigInt(0) ? "buy" : position < BigInt(0) ? "sell" : null;
  const marginBi = positionDisplayMargin(pos);
  const totalBi = positionOpenNotional(pos);
  const margin = formatOrderFee(marginBi.toString());
  const total = formatOrderFee(totalBi.toString());
  let leverage: number | null = null;
  if (marginBi > BigInt(0) && totalBi > BigInt(0)) {
    const lev = Number(totalBi / marginBi);
    leverage = Number.isFinite(lev) && lev > 0 ? lev : null;
  }
  return {
    id: String(pos.id),
    pairLabel: pairLabelFromCode(pos.pairCode),
    side,
    margin,
    total,
    liqPrice: priceX18ToNumber(pos.liqPrice),
    leverage,
    openedAt: pos.openedAt,
  };
}

export type PositionHistoryRow = {
  key: string;
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
    key: `${row.pairId}-${row.openedAt}-${row.closedAt}-${index}`,
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
