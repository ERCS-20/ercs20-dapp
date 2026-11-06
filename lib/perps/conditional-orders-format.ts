import { enginePriceToNumber } from "@/lib/market/engine-price-decimal";
import { formatOrderFee, orderSideToLabel } from "@/lib/market/open-orders-format";
import { pairLabelFromCode } from "@/lib/market/pair";
import { formatBaseQuantity, priceX18ToNumber } from "@/lib/perps/positions-format";
import { apiBigIntToString, parseApiBigInt, type ApiBigInt } from "@/lib/utils/coerce-bigint";
import { formatQuoteAmount, formatSubscriptPrice } from "@/lib/utils/price";
import type {
  ConditionalOrdersHistoryRsp,
  ConditionalOrdersRsp,
} from "@/services/perps/orders/types";

type Translate = (path: string) => string;

export type ConditionalOrderRow = {
  id: ApiBigInt;
  idLabel: string;
  pairLabel: string;
  side: "buy" | "sell" | null;
  orderTypeLabel: string;
  triggerText: string;
  limitPrice: string;
  quantity: string;
  margin: string;
  createdAt: number | string;
  status: string;
  completedAt: number | string | null;
};

export function conditionalOrderToRow(
  order: ConditionalOrdersRsp | ConditionalOrdersHistoryRsp,
  t: Translate
): ConditionalOrderRow {
  const decimals = order.enginePriceDecimal;
  const amount = parseApiBigInt(order.amount);
  return {
    id: order.id,
    idLabel: apiBigIntToString(order.id),
    pairLabel: pairLabelFromCode(order.pairCode),
    side: orderSideToLabel(order.side),
    orderTypeLabel: orderTypeLabel(order.orderType, t),
    triggerText: triggerText(order, decimals, t),
    limitPrice: limitPrice(order.enginePrice, decimals),
    quantity: amount != null && amount > BigInt(0) ? formatBaseQuantity(amount) : "—",
    margin: formatQuoteAmount(formatOrderFee(order.margin)),
    createdAt: order.createdAt,
    status: "status" in order ? order.status : "",
    completedAt: "completedAt" in order ? order.completedAt : null,
  };
}

export function formatConditionalStatus(status: string, t: Translate): string {
  if (status === "Triggered") return t("perps.conditionalStatusTriggered");
  if (status === "Canceled") return t("perps.conditionalStatusCanceled");
  if (status === "Expired") return t("perps.conditionalStatusExpired");
  if (status === "TriggerFailed") return t("perps.conditionalStatusTriggerFailed");
  return status || "—";
}

function orderTypeLabel(orderType: string, t: Translate): string {
  if (orderType === "TriggerLimit") return t("perps.orderTypeTriggerLimit");
  if (orderType === "TpSl") return t("perps.orderTypeTpSl");
  return orderType || "—";
}

function triggerText(
  order: ConditionalOrdersRsp | ConditionalOrdersHistoryRsp,
  decimals: number | null,
  t: Translate
): string {
  const source =
    order.triggerPriceType === "Mark"
      ? t("perps.triggerSourceMark")
      : t("perps.triggerSourceLast");
  const direction =
    order.triggerDirection === 1
      ? t("perps.triggerDirectionUp")
      : order.triggerDirection === 2
        ? t("perps.triggerDirectionDown")
        : "";
  if (!direction || decimals == null) return "—";
  const price = formatSubscriptPrice(priceX18ToNumber(order.triggerPriceX18), decimals);
  return t("perps.triggerConditionText")
    .replace("{source}", source)
    .replace("{direction}", direction)
    .replace("{price}", price);
}

function limitPrice(enginePrice: ApiBigInt, decimals: number | null): string {
  if (decimals == null) return "—";
  const price = enginePriceToNumber(enginePrice, decimals);
  if (!Number.isFinite(price) || price <= 0) return "—";
  return formatSubscriptPrice(price, decimals);
}
