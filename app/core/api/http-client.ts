import type { ApiResponse } from "./api-response.type";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await response.json();

    return {
      success: json.success,
      data: json.data as T,
      error: json.error?.message ?? null,
      reason: json.error?.code ?? null,
      status_code: json.status_code,
    };
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      error: error instanceof Error ? error.message : "Network error",
      reason: "NETWORK_ERROR",
      status_code: 0,
    };
  }
}

export const httpClient = {
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  get: <T>(path: string) => request<T>("GET", path),
};
