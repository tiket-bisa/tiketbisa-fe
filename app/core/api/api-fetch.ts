const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function toAbsoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${normalizedPath}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(toAbsoluteUrl(path), {
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
