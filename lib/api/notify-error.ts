import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/api/errors";

const MESSAGE_MAX = 200;

const DEFAULT_FALLBACK = "Request failed";

/** Show API error as a single-line toast (backend `msg`, no separate title). */
export function notifyApiError(error: unknown, fallback = DEFAULT_FALLBACK) {
  const message = getApiErrorMessage(error, fallback).slice(0, MESSAGE_MAX);
  toast.error(message);
}

export function notifyApiSuccess(message: string) {
  toast.success(message);
}
