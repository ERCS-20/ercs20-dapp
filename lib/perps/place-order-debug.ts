const LOG_PREFIX = "[spot-place-order]";

/** Structured logs for place-order troubleshooting (uses console.log — visible in default Console). */
export function debugPlaceOrder(step: string, data?: Record<string, unknown>): void {
  if (data) {
    console.log(LOG_PREFIX, step, data);
    return;
  }
  console.log(LOG_PREFIX, step);
}
