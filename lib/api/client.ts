import { getApiBaseUrl, getApiPathPrefix } from "@/lib/config/public-env";
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

function mergeHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

/**
 * Low-level HTTP client. Prefer `request` from `@/lib/api/request`.
 * Unwraps `{ code, msg, data }` and returns `data` on success.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, body, raw, headers, ...init } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      ...init,
      headers: mergeHeaders(headers),
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
    return undefined as T;
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiNetworkError("Invalid JSON response");
  }

  if (raw) {
    return json as T;
  }

  const envelope = json as ApiEnvelope<T>;

  if (!response.ok) {
    throw new ApiRequestError(
      envelope.code ?? String(response.status),
      envelope.msg || response.statusText || "Request failed",
      response.status
    );
  }

  if (!isApiSuccess(envelope)) {
    throw new ApiRequestError(
      envelope.code,
      envelope.msg || envelope.code || "Request failed",
      response.status
    );
  }

  return envelope.data;
}
