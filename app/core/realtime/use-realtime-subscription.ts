import { useEffect } from "react";
import { useRealtime } from "./realtime.context";
import type { RealtimeMessageHandler } from "./realtime.types";

export function useRealtimeSubscription(scopes: string[], handler: RealtimeMessageHandler): void {
  const realtime = useRealtime();

  useEffect(() => {
    if (!realtime || scopes.length === 0) {
      return;
    }
    return realtime.subscribe(scopes, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime, scopes.join("|"), handler]);
}
