import { toast } from "sonner";

import {
  AUTH_ACCESS_TOKEN_EXPIRED,
  AUTH_UNAUTHENTICATED,
} from "@/lib/auth/codes";
import { getApiErrorMessage, ApiRequestError } from "@/lib/api/errors";

const MESSAGE_MAX = 200;

const DEFAULT_FALLBACK = "Request failed";

function shouldNotify(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    if (error.code === AUTH_UNAUTHENTICATED || error.code === AUTH_ACCESS_TOKEN_EXPIRED) {
      return false;
    }
  }
  return true;
}

/** Show API error as a single-line toast (backend `msg`, no separate title). */
export function notifyApiError(error: unknown, fallback = DEFAULT_FALLBACK) {
  if (!shouldNotify(error)) return;
  const message = getApiErrorMessage(error, fallback).slice(0, MESSAGE_MAX);
  toast.error(message);
}

export function notifyApiSuccess(message: string) {
  toast.success(message);
}
