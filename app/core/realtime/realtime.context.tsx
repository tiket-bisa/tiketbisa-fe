import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "~/core/auth";
import { getRealtimeUrl } from "./realtime-url";
import type { RealtimeConnectionStatus, RealtimeMessage, RealtimeMessageHandler } from "./realtime.types";

interface RealtimeContextValue {
  status: RealtimeConnectionStatus;
  subscribe: (scopes: string[], handler: RealtimeMessageHandler) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [status, setStatus] = useState<RealtimeConnectionStatus>("idle");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const handlersRef = useRef(new Set<RealtimeMessageHandler>());
  const scopeCountsRef = useRef(new Map<string, number>());
  const authenticatedRef = useRef(false);
  const shouldReconnectRef = useRef(true);
  const reconnectAttemptRef = useRef(0);

  const send = useCallback((payload: unknown) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }
    socket.send(JSON.stringify(payload));
  }, []);

  const sendSubscriptions = useCallback(() => {
    const scopes = Array.from(scopeCountsRef.current.keys());
    if (scopes.length > 0) {
      send({ type: "subscribe", scopes });
    }
  }, [send]);

  useEffect(() => {
    if (isLoading) {
      setStatus("idle");
      return;
    }

    if (!user?.email || !user.internal_token) {
      setStatus("idle");
      return;
    }

    shouldReconnectRef.current = true;

    const connect = () => {
      setStatus((current) => (current === "idle" ? "connecting" : "reconnecting"));
      authenticatedRef.current = false;
      const socket = new WebSocket(getRealtimeUrl("/internal-tb/ws"));
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
        send({
          type: "auth",
          email: user.email,
          internalToken: user.internal_token,
        });
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as RealtimeMessage;
          if (message.type === "auth.ok") {
            authenticatedRef.current = true;
            setStatus("connected");
            sendSubscriptions();
          }
          handlersRef.current.forEach((handler) => handler(message));
        } catch {
          // Ignore malformed realtime messages.
        }
      };

      socket.onclose = (event) => {
        authenticatedRef.current = false;
        if (!shouldReconnectRef.current) {
          setStatus("disconnected");
          return;
        }

        if (event.code === 1008) {
          shouldReconnectRef.current = false;
          setStatus("disconnected");
          return;
        }

        setStatus("reconnecting");
        const reconnectDelay = Math.min(30000, 2500 * 2 ** reconnectAttemptRef.current);
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = window.setTimeout(connect, reconnectDelay);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [isLoading, send, sendSubscriptions, user?.email, user?.internal_token]);

  const subscribe = useCallback((scopes: string[], handler: RealtimeMessageHandler) => {
    const normalizedScopes = Array.from(new Set(scopes.map((scope) => scope.trim()).filter(Boolean)));
    handlersRef.current.add(handler);
    normalizedScopes.forEach((scope) => {
      scopeCountsRef.current.set(scope, (scopeCountsRef.current.get(scope) ?? 0) + 1);
    });

    if (authenticatedRef.current && normalizedScopes.length > 0) {
      send({ type: "subscribe", scopes: normalizedScopes });
    }

    return () => {
      handlersRef.current.delete(handler);
      const removedScopes: string[] = [];
      normalizedScopes.forEach((scope) => {
        const nextCount = (scopeCountsRef.current.get(scope) ?? 1) - 1;
        if (nextCount <= 0) {
          scopeCountsRef.current.delete(scope);
          removedScopes.push(scope);
        } else {
          scopeCountsRef.current.set(scope, nextCount);
        }
      });
      if (authenticatedRef.current && removedScopes.length > 0) {
        send({ type: "unsubscribe", scopes: removedScopes });
      }
    };
  }, [send]);

  const value = useMemo(() => ({ status, subscribe }), [status, subscribe]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
