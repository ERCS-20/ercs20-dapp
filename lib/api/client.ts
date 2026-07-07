import { getApiBaseUrl, getApiPathPrefix } from "@/lib/config/public-env";
import {
  AUTH_ACCESS_TOKEN_EXPIRED,
  AUTH_UNAUTHENTICATED,
} from "@/lib/auth/codes";
import { requestLoginDialog } from "@/lib/auth/coordinator";
import { refreshAuthSession } from "@/lib/auth/refresh";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import { ApiNetworkError, ApiRequestError } from "@/lib/api/errors";
import {
  type ApiEnvelope,
  isApiSuccess,
  type RequestOptions,
} from "@/lib/api/types";

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const base = getApiBaseUrl();
  const prefix = getApiPathPrefix();
  const url = `${base}${prefix}${path}`;

  if (!params) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

function mergeHeaders(init?: HeadersInit, body?: unknown): Headers {
  const headers = new Headers(init);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

type ParsedResponse<T> = {
  response: Response;
  envelope: ApiEnvelope<T>;
  isJson: boolean;
};

async function readResponse<T>(response: Response, raw?: boolean): Promise<ParsedResponse<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    if (!response.ok) {
      throw new ApiRequestError(
        String(response.status),
        response.statusText || "Request failed",
        response.status
      );
    }
    return {
      response,
      envelope: { code: "success", msg: "", data: undefined as T },
      isJson: false,
    };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiNetworkError("Invalid JSON response");
  }

  if (raw) {
    return {
      response,
      envelope: json as ApiEnvelope<T>,
      isJson: true,
    };
  }

  return {
    response,
    envelope: json as ApiEnvelope<T>,
    isJson: true,
  };
}

function throwForEnvelope<T>(response: Response, envelope: ApiEnvelope<T>): never {
  throw new ApiRequestError(
    envelope.code ?? String(response.status),
    envelope.msg || response.statusText || "Request failed",
    response.status
  );
}

async function handleAuthFailure(code: string, msg?: string): Promise<never> {
  if (code === AUTH_UNAUTHENTICATED) {
    clearAuthSession();
    requestLoginDialog();
    throw new ApiRequestError(code, msg || "unauthenticated", 401);
  }
  throw new ApiRequestError(code, msg || code, 401);
}

function unwrapEnvelope<T>(response: Response, envelope: ApiEnvelope<T>, raw?: boolean): T {
  if (raw) {
    return envelope as unknown as T;
  }

  if (!response.ok) {
    throwForEnvelope(response, envelope);
  }

  if (!isApiSuccess(envelope)) {
    throwForEnvelope(response, envelope);
  }

  return envelope.data;
}

async function executeFetch<T>(
  path: string,
  options: RequestOptions
): Promise<T> {
  const { params, body, raw, headers, _authRetried, ...init } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      ...init,
      headers: mergeHeaders(headers, body),
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch {
    throw new ApiNetworkError("Network request failed");
  }

  const { envelope, isJson } = await readResponse<T>(response, raw);

  if (!isJson) {
    return undefined as T;
  }

  const authCode = envelope.code;

  if (response.status === 401) {
    if (authCode === AUTH_ACCESS_TOKEN_EXPIRED && !_authRetried) {
      const refreshed = await refreshAuthSession();
      if (refreshed) {
        return apiFetch<T>(path, { ...options, _authRetried: true });
      }
      throw new ApiRequestError(
        authCode,
        envelope.msg || "access token expired",
        401
      );
    }
    if (authCode === AUTH_UNAUTHENTICATED) {
      await handleAuthFailure(authCode, envelope.msg);
    }
  }

  return unwrapEnvelope(response, envelope, raw);
}

/**
 * Low-level HTTP client. Prefer `request` from `@/lib/api/request`.
 * Unwraps `{ code, msg, data }` and returns `data` on success.
 * Handles AUTH_ACCESS_TOKEN_EXPIRED (refresh + retry) and AUTH_UNAUTHENTICATED (login dialog).
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  return executeFetch<T>(path, options);
}
