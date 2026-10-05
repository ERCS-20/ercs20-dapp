import { formatOrderFee } from "@/lib/perps/open-orders-format";
import { apiBigIntToString } from "@/lib/utils/coerce-bigint";
import type { OrdersCancelHistoryRsp } from "@/services/perps/orders/types";

export type CancelHistoryRow = {
  id: string;
  createdAt: number;
  amount: number;
  margin: number;
  reasonCode: string;
  status: string;
};

export function ordersCancelHistoryRspToRow(row: OrdersCancelHistoryRsp): CancelHistoryRow {
  return {
    id: apiBigIntToString(row.id),
    createdAt: row.createdAt,
    amount: formatOrderFee(row.amount),
    margin: formatOrderFee(row.margin),
    reasonCode: row.reasonCode,
    status: row.status,
  };
}

export function cancelReasonLabel(code: string, t: (key: string) => string): string {
  if (code === "UserCancel") return t("perps.cancelReasonUser");
  if (code === "SystemOrderCapacityExceeded") return t("perps.cancelReasonOrderCap");
  if (code === "SystemBucketCapacityExceeded") return t("perps.cancelReasonBucketCap");
  if (code === "SystemFokNotFillable") return t("perps.cancelReasonFok");
  if (code === "RefundMaker") return t("perps.cancelReasonRefund");
  return code || "—";
}

export function cancelStatusLabel(status: string, t: (key: string) => string): string {
  if (status === "New") return t("perps.cancelStatusNew");
  if (status === "Pending") return t("perps.cancelStatusPending");
  if (status === "Success") return t("perps.cancelStatusSuccess");
  if (status === "CancelFailed") return t("perps.cancelStatusFailed");
  return status || "—";
}
