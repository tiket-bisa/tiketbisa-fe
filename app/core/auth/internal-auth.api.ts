import { apiFetch } from "~/core/api";
import type { ApiResponse } from "~/core/api";

export interface InternalTokenResponseData {
  idToken: string;
  role: "admin" | "partner";
  brandSlug?: string | null;
  brandName?: string | null;
}

interface RawInternalTokenResponseData {
  idToken?: string;
  id_token?: string;
  role?: string;
  brandSlug?: string | null;
  brand_slug?: string | null;
  brandName?: string | null;
  brand_name?: string | null;
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

  const role = response.data.role?.trim().toLowerCase();
  if (role !== "admin" && role !== "partner") {
    throw new Error("Token response missing valid role");
  }

  const idToken = response.data.idToken ?? response.data.id_token;
  if (!idToken) {
    throw new Error("Token response missing id token");
  }

  return {
    idToken,
    role,
    brandSlug: response.data.brandSlug ?? response.data.brand_slug ?? null,
    brandName: response.data.brandName ?? response.data.brand_name ?? null,
  };
}

export async function getMe(): Promise<Omit<InternalTokenResponseData, "idToken">> {
  const response = await apiFetch<ApiResponse<RawInternalTokenResponseData>>(
    "/internal-tb/user/me",
    {
      method: "GET",
    },
  );

  if (!response.success) {
    throw new Error(getErrorMessage(response.error) ?? "Failed to fetch user details");
  }

  if (!response.data) {
    throw new Error("User details not found");
  }

  const role = response.data.role?.trim().toLowerCase();
  if (role !== "admin" && role !== "partner") {
    throw new Error("Invalid role received");
  }

  return {
    role: role as "admin" | "partner",
    brandSlug: response.data.brandSlug ?? response.data.brand_slug ?? null,
    brandName: response.data.brandName ?? response.data.brand_name ?? null,
  };
}
