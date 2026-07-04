import { apiFetch } from "@/lib/api/client";
import type { RequestOptions } from "@/lib/api/types";

type MethodOptions = Omit<RequestOptions, "method" | "body">;

export const request = {
  get<T>(url: string, options?: MethodOptions) {
    return apiFetch<T>(url, { ...options, method: "GET" });
  },

  post<T>(url: string, body?: unknown, options?: MethodOptions) {
    return apiFetch<T>(url, { ...options, method: "POST", body });
  },

  put<T>(url: string, body?: unknown, options?: MethodOptions) {
    return apiFetch<T>(url, { ...options, method: "PUT", body });
  },

  patch<T>(url: string, body?: unknown, options?: MethodOptions) {
    return apiFetch<T>(url, { ...options, method: "PATCH", body });
  },

  delete<T>(url: string, options?: MethodOptions) {
    return apiFetch<T>(url, { ...options, method: "DELETE" });
  },
};
