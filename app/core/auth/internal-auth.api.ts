import { apiFetch } from "~/core/api";
import type { ApiResponse } from "~/core/api";

export interface InternalTokenResponseData {
  idToken: string;
  role: "admin" | "partner";
  brandSlug?: string | null;
  brandName?: string | null;
}

export async function requestInternalGoogleToken(
  authCode: string,
): Promise<InternalTokenResponseData> {
  const response = await apiFetch<ApiResponse<InternalTokenResponseData>>(
    "/internal-tb/token/request",
    {
      method: "POST",
      body: JSON.stringify({ authCode }),
    },
  );

  if (!response.data) {
    throw new Error("Empty token response from server");
  }

  return response.data;
}
