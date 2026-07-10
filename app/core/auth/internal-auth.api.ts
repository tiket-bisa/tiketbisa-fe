import { apiFetch, internalHttpClient } from "~/core/api";
import type { ApiResponse } from "~/core/api";

export interface InternalTokenResponseData {
  idToken: string;
  role: "admin" | "partner" | "scanner";
  brandSlug?: string | null;
  brandName?: string | null;
  brandId?: string | null;
  username?: string | null;
}

interface RawInternalTokenResponseData {
  idToken?: string;
  id_token?: string;
  role?: string;
  brandSlug?: string | null;
  brand_slug?: string | null;
  brandName?: string | null;
  brand_name?: string | null;
  brandId?: string | null;
  brand_id?: string | null;
  username?: string | null;
}

function getErrorMessage(error: unknown): string | null {
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return null;
}

function normalizeInternalTokenResponse(
  data: RawInternalTokenResponseData,
): InternalTokenResponseData {
  const role = data.role?.trim().toLowerCase();
  if (role !== "admin" && role !== "partner" && role !== "scanner") {
    throw new Error("Token response missing valid role");
  }

  const idToken = data.idToken ?? data.id_token;
  if (!idToken) {
    throw new Error("Token response missing id token");
  }

  return {
    idToken,
    role,
    brandSlug: data.brandSlug ?? data.brand_slug ?? null,
    brandName: data.brandName ?? data.brand_name ?? null,
    brandId: data.brandId ?? data.brand_id ?? null,
    username: data.username ?? null,
  };
}

export async function requestInternalGoogleToken(
  authCode: string,
): Promise<InternalTokenResponseData> {
  const response = await apiFetch<ApiResponse<RawInternalTokenResponseData>>(
    "/internal-tb/token/request",
    {
      method: "POST",
      body: JSON.stringify({ authCode }),
    },
  );

  if (!response.success) {
    const message = getErrorMessage(response.error);
    if (response.status_code === 401 || response.status_code === 403) {
      throw new Error(message ?? "Unauthorized");
    }
    throw new Error(message ?? "Failed to request token");
  }

  if (!response.data) {
    throw new Error("Unauthorized");
  }

  return normalizeInternalTokenResponse(response.data);
}

export async function refreshInternalToken(): Promise<InternalTokenResponseData> {
  const response = await internalHttpClient.post<RawInternalTokenResponseData>("/token/refresh", {});

  if (!response.success) {
    const message = getErrorMessage(response.error);
    if (response.status_code === 401 || response.status_code === 403) {
      throw new Error(message ?? "Unauthorized");
    }
    throw new Error(message ?? "Failed to refresh token");
  }

  if (!response.data) {
    throw new Error("Unauthorized");
  }

  return normalizeInternalTokenResponse(response.data);
}

export async function requestScannerToken(
  username: string,
  password: string,
): Promise<InternalTokenResponseData> {
  const response = await apiFetch<ApiResponse<RawInternalTokenResponseData>>(
    "/internal-tb/token/scanner/login",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
  );

  if (!response.success) {
    const message = getErrorMessage(response.error);
    if (response.status_code === 401 || response.status_code === 403) {
      throw new Error(message ?? "Unauthorized");
    }
    throw new Error(message ?? "Failed to request scanner token");
  }

  if (!response.data) {
    throw new Error("Unauthorized");
  }

  return normalizeInternalTokenResponse(response.data);
}

export async function getMe(): Promise<Omit<InternalTokenResponseData, "idToken">> {
  const response = await internalHttpClient.get<RawInternalTokenResponseData>("/user/me");

  if (!response.success) {
    throw new Error(getErrorMessage(response.error) ?? "Failed to fetch user details");
  }

  if (!response.data) {
    throw new Error("User details not found");
  }

  const role = response.data.role?.trim().toLowerCase();
  if (role !== "admin" && role !== "partner" && role !== "scanner") {
    throw new Error("Invalid role received");
  }

  return {
    role: role as "admin" | "partner" | "scanner",
    brandSlug: response.data.brandSlug ?? response.data.brand_slug ?? null,
    brandName: response.data.brandName ?? response.data.brand_name ?? null,
    brandId: response.data.brandId ?? response.data.brand_id ?? null,
    username: response.data.username ?? null,
  };
}
