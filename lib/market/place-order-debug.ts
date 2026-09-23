/** Structured logs for place-order troubleshooting. */
export function debugPlaceOrder(
  product: "spot" | "perps",
  step: string,
  data?: Record<string, unknown>
): void {
  const prefix = product === "spot" ? "[spot-place-order]" : "[perps-place-order]";
  if (data) {
    console.log(prefix, step, data);
    return;
  }
  console.log(prefix, step);
}
