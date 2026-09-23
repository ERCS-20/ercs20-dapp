import type { ApiBigInt } from "@/lib/utils/coerce-bigint";

/** Shared order list DTOs used by open-orders formatters (spot + perps). */

export type OrdersRsp = {
  id: number;
  pairId: number;
  pairCode: string;
  makerAmount: ApiBigInt;
  takerAmount: ApiBigInt;
  timeInForce: number;
  expiry: number;
  salt: ApiBigInt;
  enginePrice: ApiBigInt;
  enginePriceDecimal: number;
  quantity: ApiBigInt;
  side: number;
  filledMakerAmount: ApiBigInt;
  filledTakerAmount: ApiBigInt;
  fee: ApiBigInt;
  status: string;
  placedAt: number;
};

export type OrdersHistoryRsp = OrdersRsp & {
  completedAt: number;
};

export type OrdersTradeHistoryRsp = {
  pairId: number;
  pairCode: string;
  orderId: ApiBigInt;
  enginePrice: ApiBigInt;
  enginePriceDecimal: number;
  quantity: ApiBigInt;
  amount: ApiBigInt;
  fee: ApiBigInt;
  placeSide: number;
  matchedSide: number;
  tradeTime: number;
  tradeStatus: string;
  txHash: string;
};
