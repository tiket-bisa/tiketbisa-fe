import type { ApiResponse } from "./api-response.type";
import { AUTH_STORAGE_KEY } from "~/core/auth/auth.constants";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const INTERNAL_API_PREFIX = "/internal-tb";

interface StoredAuthSession {
  email?: string;
  internal_token?: string;
}

function getStoredAuthSession(): StoredAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as StoredAuthSession;
  } catch {
    return null;
  }
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${normalizePath(path)}`, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
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
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

function getInternalAuthHeaders(): Record<string, string> {
  const session = getStoredAuthSession();
  if (!session?.email || !session.internal_token) {
    return {};
  }

  return {
    "x-tb-identifier": session.email,
    "x-tb-internal-token": session.internal_token,
  };
}

export const internalHttpClient = {
  get: <T>(path: string) =>
    request<T>("GET", `${INTERNAL_API_PREFIX}${normalizePath(path)}`, undefined, getInternalAuthHeaders()),
  post: <T>(path: string, body: unknown) =>
    request<T>("POST", `${INTERNAL_API_PREFIX}${normalizePath(path)}`, body, getInternalAuthHeaders()),
  put: <T>(path: string, body: unknown) =>
    request<T>("PUT", `${INTERNAL_API_PREFIX}${normalizePath(path)}`, body, getInternalAuthHeaders()),
  delete: <T>(path: string) =>
    request<T>("DELETE", `${INTERNAL_API_PREFIX}${normalizePath(path)}`, undefined, getInternalAuthHeaders()),
};