import type { ApiResponse } from "./api-response.type";
import { AUTH_STORAGE_KEY } from "~/core/auth/auth.constants";
import { toAbsoluteApiUrl } from "./api-url";

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
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function persistInternalAuthToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const session = getStoredAuthSession();
  if (!session) {
    return;
  }

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      ...session,
      internal_token: token,
    }),
  );
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<ApiResponse<T>> {
  try {
    const url = toAbsoluteApiUrl(path);
    const isInternalRequest = path.startsWith(INTERNAL_API_PREFIX);
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (isInternalRequest) {
      const refreshedToken = response.headers.get("x-tb-internal-token");
      if (refreshedToken) {
        persistInternalAuthToken(refreshedToken);
      }
    }

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
  if (!session?.internal_token) {
    if (!session?.email) {
      return {};
    }
    return {
      "x-tb-identifier": session.email,
    };
  }

  const headers: Record<string, string> = {
    "x-tb-internal-token": session.internal_token,
  };

  if (session.email) {
    headers["x-tb-identifier"] = session.email;
  }

  return headers;
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
