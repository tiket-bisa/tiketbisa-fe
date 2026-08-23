import { toAbsoluteApiUrl } from "./api-url";
import { ApiRequestError, apiErrorFromResponse, sanitizeApiEnvelope } from "./api-error";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  const isFormDataBody = typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (init?.body && !isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(toAbsoluteApiUrl(path), {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const bodyText = await response.text();
  let payload: (T & { error?: unknown }) | null = null;

  if (bodyText.length > 0) {
    try {
      payload = JSON.parse(bodyText) as T & { error?: unknown };
    } catch {
      if (contentType.includes("application/json")) {
        throw new ApiRequestError("Respons layanan tidak dapat diproses. Silakan coba lagi.", {
          requestId: response.headers.get("X-Request-Id") ?? undefined,
          statusCode: response.status,
        });
      }
    }
  }

  if (!payload) {
    if (!response.ok) {
      throw apiErrorFromResponse(null, response);
    }

    throw new ApiRequestError("Respons layanan tidak dapat diproses. Silakan coba lagi.", {
      requestId: response.headers.get("X-Request-Id") ?? undefined,
      statusCode: response.status,
    });
  }
  if (!response.ok) {
    throw apiErrorFromResponse(payload, response);
  }

  return sanitizeApiEnvelope(payload, response);
}
