import {
  formatOrderFee,
  formatOrderQuantity,
  orderSideToLabel,
} from "@/lib/market/open-orders-format";
import { pairLabelFromCode } from "@/lib/market/pair";
import { parseApiBigInt, type ApiBigInt } from "@/lib/utils/coerce-bigint";
import type { PositionsRsp } from "@/services/perps/orders/types";

export type PositionRow = {
  id: string;
  pairLabel: string;
  side: "buy" | "sell" | null;
  margin: number;
  /** Quote notional = |position| × avgEntry. */
  total: number;
  avgEntry: number;
  liqPrice: number;
  /** Isolated leverage ≈ total / margin. */
  leverage: number | null;
  updatedAt: number;
};

/** `avgEntryX18` / `liqPrice` are quote-per-base × 1e18. */
export function priceX18ToNumber(raw: ApiBigInt): number {
  const bi = parseApiBigInt(raw) ?? BigInt(0);
  if (bi === BigInt(0)) return 0;
  return Number(bi) / 10 ** 18;
}

/**
 * Leverage ≈ quoteNotional / margin where
 * `quoteNotional = |position| × avgEntryX18 / 1e18`.
 */
export function leverageFromPositionAndMargin(
  position: ApiBigInt,
  margin: ApiBigInt,
  avgEntryX18: ApiBigInt
): number | null {
  let positionBi = parseApiBigInt(position) ?? BigInt(0);
  let marginBi = parseApiBigInt(margin) ?? BigInt(0);
  const entryBi = parseApiBigInt(avgEntryX18) ?? BigInt(0);
  if (positionBi < BigInt(0)) positionBi = -positionBi;
  if (marginBi < BigInt(0)) marginBi = -marginBi;
  if (positionBi <= BigInt(0) || marginBi <= BigInt(0) || entryBi <= BigInt(0)) {
    return null;
  }
  const quoteNotional = (positionBi * entryBi) / (BigInt(10) ** BigInt(18));
  if (quoteNotional <= BigInt(0)) return null;
  const lev = Number(quoteNotional / marginBi);
  return Number.isFinite(lev) && lev > 0 ? lev : null;
}

export function positionsRspToRow(pos: PositionsRsp): PositionRow {
  const positionRaw = parseApiBigInt(pos.position) ?? BigInt(0);
  const absPosition =
    positionRaw < BigInt(0) ? -positionRaw : positionRaw;
  const avgEntry = priceX18ToNumber(pos.avgEntryX18);
  const position = formatOrderQuantity(absPosition.toString());
  const margin = formatOrderFee(pos.margin);
  return {
    id: String(pos.id),
    pairLabel: pairLabelFromCode(pos.pairCode),
    side: orderSideToLabel(pos.side),
    margin,
    total: avgEntry > 0 ? avgEntry * position : 0,
    avgEntry,
    liqPrice: priceX18ToNumber(pos.liqPrice),
    leverage: leverageFromPositionAndMargin(
      pos.position,
      pos.margin,
      pos.avgEntryX18
    ),
    updatedAt: pos.updatedAt,
  };
}
