const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:8080";
const DEFAULT_PRODUCTION_API_BASE_URL = "https://api.tiketbisa.com";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  const defaultBrowserBaseUrl = import.meta.env.PROD
    ? DEFAULT_PRODUCTION_API_BASE_URL
    : DEFAULT_LOCAL_API_BASE_URL;
  const browserBaseUrl = stripTrailingSlash(
    import.meta.env.VITE_API_BASE_URL || defaultBrowserBaseUrl,
  );
  const serverBaseUrl = stripTrailingSlash(
    import.meta.env.VITE_API_INTERNAL_BASE_URL || browserBaseUrl,
  );

  return typeof window === "undefined" ? serverBaseUrl : browserBaseUrl;
}

export function toAbsoluteApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
