export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error(`Expected JSON response but received '${contentType ?? "unknown"}'`);
  }

  const payload = (await response.json()) as T & { error?: unknown };
  if (!response.ok) {
    const errorMessage = typeof payload.error === "string" && payload.error.trim().length > 0
      ? payload.error
      : `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload;
}
