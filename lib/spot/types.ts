/** Spot UI aliases over shared market domain types. */

export type {
  OrderSide as SpotSide,
  OrderType as SpotOrderType,
  OrderStatus as SpotOrderStatus,
  CancelStatus as SpotCancelStatus,
  TradingPair as SpotPair,
  MarketStats as SpotMarketStats,
  OrderBookLevel,
  OrderBookSnapshot as SpotOrderBook,
  MarketTradeRow as SpotMarketTrade,
  OrderDraft as SpotOrderDraft,
} from "@/lib/market/types";

export type { ChartInterval, ChartTimeframe } from "@/lib/market/chart-interval";

export type SpotUserTrade = {
  id: string;
  pairLabel: string;
  side: import("@/lib/market/types").OrderSide;
  price: number;
  quantity: number;
  fee: number;
  txHash: string;
  time: number;
};

export type SpotOrder = {
  id: string;
  orderId: string;
  pairLabel: string;
  side: import("@/lib/market/types").OrderSide;
  price: number;
  amount: number;
  filled: number;
  average: number;
  fee: number;
  status: import("@/lib/market/types").OrderStatus;
  cancelStatus: import("@/lib/market/types").CancelStatus;
  txHash: string;
  createdAt: number;
};
