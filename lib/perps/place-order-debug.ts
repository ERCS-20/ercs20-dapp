import { debugPlaceOrder as debug } from "@/lib/market/place-order-debug";

export function debugPlaceOrder(
  step: string,
  data?: Record<string, unknown>
): void {
  debug("perps", step, data);
}
