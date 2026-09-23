/** Perps UI aliases over shared market domain types. */

export type {
  OrderSide as PerpsSide,
  OrderType as PerpsOrderType,
  OrderStatus as PerpsOrderStatus,
  CancelStatus as PerpsCancelStatus,
  TradingPair as PerpsPair,
  MarketStats as PerpsMarketStats,
  OrderBookLevel,
  OrderBookSnapshot as PerpsOrderBook,
  MarketTradeRow as PerpsMarketTrade,
  OrderDraft as PerpsOrderDraft,
} from "@/lib/market/types";

export type { ChartInterval, ChartTimeframe } from "@/lib/market/chart-interval";

export type PerpsUserTrade = {
  id: string;
  pairLabel: string;
  side: import("@/lib/market/types").OrderSide;
  price: number;
  quantity: number;
  fee: number;
  txHash: string;
  time: number;
};

export type PerpsOrder = {
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
