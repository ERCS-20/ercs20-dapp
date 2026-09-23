export { debugPlaceOrder as debugPlaceOrderShared } from "@/lib/market/place-order-debug";
import { debugPlaceOrder as debug } from "@/lib/market/place-order-debug";

export function debugPlaceOrder(
  step: string,
  data?: Record<string, unknown>
): void {
  debug("spot", step, data);
}
