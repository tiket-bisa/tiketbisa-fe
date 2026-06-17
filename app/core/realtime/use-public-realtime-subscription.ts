import { useEffect } from "react";
import { getRealtimeUrl } from "./realtime-url";
import type { RealtimeMessage, RealtimeMessageHandler } from "./realtime.types";

export function usePublicRealtimeSubscription(scopes: string[], handler: RealtimeMessageHandler): void {
  useEffect(() => {
    const normalizedScopes = Array.from(new Set(scopes.map((scope) => scope.trim()).filter(Boolean)));
    if (normalizedScopes.length === 0 || typeof window === "undefined") {
      return;
    }

    let closed = false;
    let reconnectTimer: number | null = null;
    let socket: WebSocket | null = null;

    const connect = () => {
      socket = new WebSocket(getRealtimeUrl("/ws"));
      socket.onopen = () => {
        socket?.send(JSON.stringify({ type: "subscribe", scopes: normalizedScopes }));
      };
      socket.onmessage = (event) => {
        try {
          handler(JSON.parse(event.data) as RealtimeMessage);
        } catch {
          // Ignore malformed realtime messages.
        }
      };
      socket.onclose = () => {
        if (!closed) {
          reconnectTimer = window.setTimeout(connect, 2500);
        }
      };
      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer != null) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopes.join("|"), handler]);
}
