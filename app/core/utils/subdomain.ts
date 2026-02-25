/**
 * Tiketbisa — Subdomain Detection Utility
 *
 * Determines app mode (external vs internal) based on the request hostname.
 * Subdomain-agnostic: change INTERNAL_SUBDOMAIN when the name is finalized.
 */

/** Change this once the subdomain is confirmed */
const INTERNAL_SUBDOMAIN = import.meta.env.VITE_INTERNAL_SUBDOMAIN ?? "partner";

export type AppMode = "external" | "internal";

/**
 * Server-side: extract app mode from the incoming Request.
 */
export function getAppMode(request: Request): AppMode {
  const host = request.headers.get("host") ?? "";
  return isInternalHost(host) ? "internal" : "external";
}

/**
 * Client-side: extract app mode from window.location.
 * Falls back to `?mode=internal` query param for local development.
 */
export function getClientAppMode(): AppMode {
  if (typeof window === "undefined") return "external";

  const host = window.location.hostname;
  if (isInternalHost(host)) return "internal";

  // Dev fallback: ?mode=internal
  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") === "internal") return "internal";

  return "external";
}

function isInternalHost(host: string): boolean {
  const subdomain = host.split(".")[0];
  return subdomain === INTERNAL_SUBDOMAIN;
}
