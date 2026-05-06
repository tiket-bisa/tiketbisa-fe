import { toAbsoluteApiUrl } from "./api-url";

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
        throw new Error("Invalid JSON response from server");
      }
    }
  }

  if (!payload) {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    throw new Error(`Expected JSON response but received '${contentType || "unknown"}'`);
  }
  if (!response.ok) {
    const errorMessage = typeof payload.error === "string" && payload.error.trim().length > 0
      ? payload.error
      : `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload;
}
