const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
