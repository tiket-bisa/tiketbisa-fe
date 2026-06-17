import { getApiBaseUrl } from "~/core/api";

export function getRealtimeUrl(path: "/ws" | "/internal-tb/ws"): string {
  const apiBase = getApiBaseUrl();
  const url = new URL(apiBase);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = path;
  url.search = "";
  return url.toString();
}
