"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSignTypedData } from "wagmi";

import { useWallet } from "@/hooks/use-wallet";
import { isPerpsExchangeConfigured } from "@/lib/config/perps-exchange";
import { getDefaultDecimals } from "@/lib/config/public-env";
import { parseEnginePrice } from "@/lib/market/order-place-amounts";
import { buildPlaceOrderFields } from "@/lib/perps/build-place-order";
import {
  CONDITIONAL_ORDER_TP_SL,
  priceInputToX18,
  TRIGGER_PRICE_LAST,
  triggerDirectionAgainstPrice,
} from "@/lib/perps/conditional-order";
import { clampPerpsLeverage, readCachedPerpsLeverage } from "@/lib/perps/leverage";
import { getPerpsOrderErrorMessage } from "@/lib/perps/order-error-message";
import { orderQuoteAmountBaseUnits } from "@/lib/perps/pair-api";
import { getPlaceOrderSignTypedData } from "@/lib/perps/place-order-eip712";
import type { PerpsSide } from "@/lib/perps/types";
import { parseApiBigInt } from "@/lib/utils/coerce-bigint";
import { formatBalance } from "@/lib/utils/format/balance";
import { useAuth } from "@/providers/auth-provider";
import { useI18n } from "@/providers/i18n-provider";
import { getPerpsOrdersUserBalance } from "@/services/perps/orders/api";
import {
  useOrderSalt,
  usePlaceConditionalOrder,
  usePlaceOrder,
} from "@/services/perps/orders/hooks";
import type { PlaceConditionalOrderReq, PlaceOrderReq } from "@/services/perps/orders/types";

export type PlacePerpsOrderInput = {
  side: PerpsSide;
  price: string;
  quantity: string;
  pairId: number;
  enginePriceDecimal: number | null | undefined;
  /** Position leverage when known. Otherwise the cached open-order leverage. */
  leverage: number | null;
  reduceOnly: 0 | 1;
  minTrade?: bigint | null;
  quoteSymbol: string;
};

export type PlaceTpSlInput = PlacePerpsOrderInput & {
  triggerPrice: string;
  /** Current price used to decide rise-to / fall-to. */
  currentPrice: string;
};

function priceFractionDigits(raw: string): number {
  const dot = raw.indexOf(".");
  if (dot < 0) return 0;
  return raw.slice(dot + 1).replace(/0+$/, "").length;
}

function orderLeverage(leverage: number | null): number {
  if (leverage != null && Number.isFinite(leverage) && leverage > 0) {
    return clampPerpsLeverage(leverage);
  }
  return readCachedPerpsLeverage();
}

export function usePlacePerpsOrder() {
  const { t } = useI18n();
  const { address, isConnected, chainId } = useWallet();
  const { isAuthenticated } = useAuth();
  const { signTypedDataAsync } = useSignTypedData();
  const { mutateAsync: fetchOrderSalt } = useOrderSalt();
  const { mutateAsync: submitPlaceOrder } = usePlaceOrder();
  const { mutateAsync: submitConditionalOrder } = usePlaceConditionalOrder();
  const [pending, setPending] = useState(false);
  const lock = useRef(false);

  async function place(input: PlacePerpsOrderInput): Promise<boolean> {
    if (lock.current) return false;
    const blocked = blockedReason(t, input, { isConnected, address, isAuthenticated, chainId });
    if (blocked) {
      if (blocked.connect) toast.message(blocked.text);
      else toast.error(blocked.text);
      return false;
    }
    lock.current = true;
    setPending(true);
    try {
      await signAndSubmit(input, {
        address: address!,
        chainId: chainId!,
        leverage: orderLeverage(input.leverage),
        fetchOrderSalt,
        signTypedDataAsync,
        submitPlaceOrder,
      });
      toast.success(t("perps.orderPlaced"));
      return true;
    } catch (error) {
      toast.error(getPerpsOrderErrorMessage(error, t, t("perps.orderFailed")));
      return false;
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  async function placeTpSl(input: PlaceTpSlInput): Promise<boolean> {
    if (lock.current) return false;
    const blocked = blockedReason(t, input, { isConnected, address, isAuthenticated, chainId });
    const triggerBlocked = blocked ? null : tpSlBlocked(t, input);
    const reason = blocked ?? triggerBlocked;
    if (reason) {
      if (reason.connect) toast.message(reason.text);
      else toast.error(reason.text);
      return false;
    }
    lock.current = true;
    setPending(true);
    try {
      await signAndSubmitTpSl(input, {
        address: address!,
        chainId: chainId!,
        leverage: orderLeverage(input.leverage),
        fetchOrderSalt,
        signTypedDataAsync,
        submitConditionalOrder,
      });
      toast.success(t("perps.orderPlaced"));
      return true;
    } catch (error) {
      toast.error(getPerpsOrderErrorMessage(error, t, t("perps.orderFailed")));
      return false;
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  return { place, placeTpSl, pending };
}

function blockedReason(
  t: (path: string) => string,
  input: PlacePerpsOrderInput,
  gate: {
    isConnected: boolean;
    address: `0x${string}` | undefined;
    isAuthenticated: boolean;
    chainId: number | null | undefined;
  }
): { text: string; connect?: boolean } | null {
  if (!gate.isConnected || !gate.address) {
    return { text: t("perps.connectToTrade"), connect: true };
  }
  if (!gate.isAuthenticated) return { text: t("auth.loginTitle") };
  if (!isPerpsExchangeConfigured() || gate.chainId == null) return { text: t("perps.orderFailed") };
  if (input.enginePriceDecimal == null) return { text: t("perps.orderFailed") };
  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return { text: t("perps.invalidAmount") };
  const price = Number(input.price);
  if (!input.price.trim() || !Number.isFinite(price) || price <= 0) return { text: t("perps.invalidPrice") };
  if (priceFractionDigits(input.price) > input.enginePriceDecimal) {
    return {
      text: t("perps.priceDecimalLimit").replace("{digits}", String(input.enginePriceDecimal)),
    };
  }
  if (parseEnginePrice(input.price, input.enginePriceDecimal) == null) {
    return { text: t("perps.invalidPrice") };
  }
  const quoteAmount = orderQuoteAmountBaseUnits(
    input.quantity,
    input.price,
    input.enginePriceDecimal,
    input.side
  );
  const minTrade = input.minTrade;
  if (minTrade != null && minTrade > BigInt(0) && (quoteAmount == null || quoteAmount < minTrade)) {
    return {
      text: t("perps.minTotal")
        .replace("{min}", formatBalance(minTrade, getDefaultDecimals()))
        .replace("{symbol}", input.quoteSymbol),
    };
  }
  return null;
}

function tpSlBlocked(
  t: (path: string) => string,
  input: PlaceTpSlInput
): { text: string; connect?: boolean } | null {
  const decimals = input.enginePriceDecimal;
  if (decimals == null) return { text: t("perps.orderFailed") };
  if (priceFractionDigits(input.triggerPrice) > decimals) {
    return {
      text: t("perps.priceDecimalLimit").replace("{digits}", String(decimals)),
    };
  }
  if (priceInputToX18(input.currentPrice, decimals) == null) {
    return { text: t("perps.closeNoCurrent") };
  }
  if (triggerDirectionAgainstPrice(input.triggerPrice, input.currentPrice, decimals) == null) {
    return { text: t("perps.triggerMustDiffer") };
  }
  return null;
}

async function signAndSubmit(
  input: PlacePerpsOrderInput,
  ctx: {
    address: `0x${string}`;
    chainId: number;
    leverage: number;
    fetchOrderSalt: () => Promise<{ salt: string }>;
    signTypedDataAsync: (
      args: ReturnType<typeof getPlaceOrderSignTypedData>
    ) => Promise<unknown>;
    submitPlaceOrder: (req: PlaceOrderReq) => Promise<void>;
  }
): Promise<void> {
  const fields = await buildSignedFields(input, ctx);
  const signature = await ctx.signTypedDataAsync(
    getPlaceOrderSignTypedData(
      {
        trader: fields.maker,
        marketId: fields.pairId,
        amount: fields.amount,
        margin: fields.margin,
        priceX18: fields.priceX18,
        isBuy: input.side === "buy",
        nonce: fields.salt,
        expiry: fields.expiry,
      },
      ctx.chainId
    )
  );
  if (typeof signature !== "string") throw new Error("INVALID_SIGNATURE");
  await ctx.submitPlaceOrder({
    userBalanceId: fields.userBalanceId,
    pairId: fields.pairId,
    maker: fields.maker,
    amount: fields.amount,
    margin: fields.margin,
    timeInForce: fields.timeInForce,
    expiry: fields.expiry,
    salt: fields.salt,
    signature,
    priceX18: fields.priceX18,
    side: fields.side,
    reduceOnly: input.reduceOnly,
  });
}

async function signAndSubmitTpSl(
  input: PlaceTpSlInput,
  ctx: {
    address: `0x${string}`;
    chainId: number;
    leverage: number;
    fetchOrderSalt: () => Promise<{ salt: string }>;
    signTypedDataAsync: (
      args: ReturnType<typeof getPlaceOrderSignTypedData>
    ) => Promise<unknown>;
    submitConditionalOrder: (req: PlaceConditionalOrderReq) => Promise<void>;
  }
): Promise<void> {
  const decimals = input.enginePriceDecimal;
  if (decimals == null) throw new Error("Missing price decimals");
  const triggerPriceX18 = priceInputToX18(input.triggerPrice, decimals);
  const triggerDirection = triggerDirectionAgainstPrice(
    input.triggerPrice,
    input.currentPrice,
    decimals
  );
  if (triggerPriceX18 == null || triggerDirection == null) {
    throw new Error("INVALID_PRICE");
  }
  const fields = await buildSignedFields(input, ctx);
  const signature = await ctx.signTypedDataAsync(
    getPlaceOrderSignTypedData(
      {
        trader: fields.maker,
        marketId: fields.pairId,
        amount: fields.amount,
        margin: fields.margin,
        priceX18: fields.priceX18,
        isBuy: input.side === "buy",
        nonce: fields.salt,
        expiry: fields.expiry,
      },
      ctx.chainId
    )
  );
  if (typeof signature !== "string") throw new Error("INVALID_SIGNATURE");
  await ctx.submitConditionalOrder({
    userBalanceId: fields.userBalanceId,
    pairId: fields.pairId,
    maker: fields.maker,
    amount: fields.amount,
    margin: fields.margin,
    timeInForce: fields.timeInForce,
    expiry: fields.expiry,
    salt: fields.salt,
    signature,
    priceX18: fields.priceX18,
    side: fields.side,
    reduceOnly: 1,
    orderType: CONDITIONAL_ORDER_TP_SL,
    triggerPriceX18,
    triggerDirection,
    triggerPriceType: TRIGGER_PRICE_LAST,
  });
}

async function buildSignedFields(
  input: PlacePerpsOrderInput,
  ctx: {
    address: `0x${string}`;
    leverage: number;
    fetchOrderSalt: () => Promise<{ salt: string }>;
  }
) {
  const enginePriceDecimal = input.enginePriceDecimal;
  if (enginePriceDecimal == null) throw new Error("Missing price decimals");
  const { salt } = await ctx.fetchOrderSalt();
  const fields = buildPlaceOrderFields({
    pairId: input.pairId,
    side: input.side,
    price: input.price,
    quantity: input.quantity,
    enginePriceDecimal,
    maker: ctx.address,
    salt: BigInt(salt),
    leverage: ctx.leverage,
  });
  const balance = await getPerpsOrdersUserBalance();
  const available = parseApiBigInt(balance.balance);
  const userBalanceId = balance.userBalanceId;
  if (userBalanceId == null || available == null || available < fields.margin) {
    throw new Error("INSUFFICIENT_BALANCE");
  }
  return { ...fields, userBalanceId };
}
