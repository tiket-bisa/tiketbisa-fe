import type { ApiResponse } from "./api-response.type";
import { AUTH_STORAGE_KEY } from "~/core/auth/auth.constants";
import { toAbsoluteApiUrl } from "./api-url";
import { apiErrorFromResponse, sanitizeApiEnvelope, toUserFacingResponseError } from "./api-error";

const INTERNAL_API_PREFIX = "/internal-tb";

interface StoredAuthSession {
  identifier?: string;
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

    // Handle non-JSON error responses (e.g. nginx 413, 502, 504)
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok && !contentType.includes("application/json")) {
      let fallback: string;
      if (response.status === 413) {
        fallback = "Ukuran file terlalu besar. Maksimal 10MB.";
      } else if (response.status === 502 || response.status === 503) {
        fallback = "Layanan sedang tidak tersedia. Coba lagi nanti.";
      } else if (response.status === 504) {
        fallback = "Layanan belum merespons. Coba lagi nanti.";
      } else {
        fallback = "Permintaan tidak dapat diproses. Silakan coba lagi.";
      }
      const requestError = apiErrorFromResponse(null, response, fallback);
      return {
        success: false,
        data: null as unknown as T,
        error: requestError.message,
        reason: `HTTP_${response.status}`,
        status_code: response.status,
        request_id: requestError.requestId,
      };
    }

    const json = sanitizeApiEnvelope(await response.json(), response);

    // Only authentication failures invalidate the session. A 403 is a scoped authorization
    // failure and must remain visible on the current page instead of logging the operator out.
    // Skip token endpoints to avoid redirect loops during login/refresh flows
    if (
      isInternalRequest &&
      !json.success &&
      json.status_code === 401 &&
      !path.includes("/token/request") &&
      !path.includes("/token/refresh") &&
      !path.includes("/user/me")
    ) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        window.location.href = "/internal-tb";
      }
    }

    return {
      success: json.success,
      data: json.data as T,
      error: json.success ? null : toUserFacingResponseError(json, "Permintaan tidak dapat diproses. Silakan coba lagi."),
      reason: json.reason ?? null,
      status_code: json.status_code,
      request_id: json.request_id,
    };
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      error: "Koneksi bermasalah. Periksa jaringan lalu coba lagi.",
      reason: "NETWORK_ERROR",
      status_code: 0,
    };
  }
}

export const httpClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body),
};

function getInternalAuthHeaders(): Record<string, string> {
  const session = getStoredAuthSession();
  if (!session?.internal_token) {
    const identifier = session?.identifier ?? session?.email;
    if (!identifier) {
      return {};
    }
    return {
      "x-tb-identifier": identifier,
    };
  }

  const headers: Record<string, string> = {
    "x-tb-internal-token": session.internal_token,
  };

  if (session.identifier || session.email) {
    headers["x-tb-identifier"] = session.identifier ?? session.email ?? "";
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
