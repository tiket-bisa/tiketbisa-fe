import { toAbsoluteApiUrl } from "./api-url";

export function normalizeImageUrl(value?: string | null): string {
  if (!value) return "";

  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  const localUploadMatch = trimmed.match(/\/(temp-(?:event-banners|brand-images)\/[^/]+)$/);
  if (localUploadMatch) {
    return toAbsoluteApiUrl(`/${localUploadMatch[1]}`);
  }

  return toAbsoluteApiUrl(trimmed);
}
