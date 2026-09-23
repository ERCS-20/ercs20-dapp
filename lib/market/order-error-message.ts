import { ApiRequestError, getApiErrorMessage } from "@/lib/api/errors";

type OrderI18nNs = "spot" | "perps";

function errorCodeI18n(ns: OrderI18nNs): Record<string, string> {
  return {
    INSUFFICIENT_BALANCE: `${ns}.insufficientBalance`,
    INVALID_AMOUNT: `${ns}.invalidAmount`,
    INVALID_PARAM: `${ns}.orderFailed`,
    INVALID_SALT: `${ns}.orderFailed`,
    INVALID_SIGNATURE: `${ns}.orderFailed`,
    INVALID_EXPIRY: `${ns}.orderFailed`,
    INVALID_TIME_IN_FORCE: `${ns}.orderFailed`,
    PAIR_NOT_FOUND: `${ns}.orderFailed`,
    USER_BALANCES_ID_NOT_FOUND: `${ns}.orderFailed`,
    AMOUNT_NOT_MATCH: `${ns}.orderFailed`,
    ORDER_DUPLICATE: `${ns}.orderFailed`,
    MIN_TRADE_AMOUNT: `${ns}.orderFailed`,
  };
}

function looksLikeErrorCode(value: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(value);
}

/** Map API ErrorCode / raw msg to localized copy for place-order UX. */
export function getOrderErrorMessage(
  ns: OrderI18nNs,
  error: unknown,
  t: (key: string) => string,
  fallback: string
): string {
  const map = errorCodeI18n(ns);

  if (error instanceof ApiRequestError) {
    const fromCode = map[error.code];
    if (fromCode) return t(fromCode);
    const fromMsg = map[error.message];
    if (fromMsg) return t(fromMsg);
    if (looksLikeErrorCode(error.message)) return fallback;
  }

  const raw = getApiErrorMessage(error, "");
  if (raw && map[raw]) {
    return t(map[raw]);
  }
  if (raw && looksLikeErrorCode(raw)) {
    return fallback;
  }
  return getApiErrorMessage(error, fallback);
}

export function getSpotOrderErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallback: string
): string {
  return getOrderErrorMessage("spot", error, t, fallback);
}

export function getPerpsOrderErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallback: string
): string {
  return getOrderErrorMessage("perps", error, t, fallback);
}
