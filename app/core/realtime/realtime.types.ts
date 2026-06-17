export type RealtimeConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

export interface RealtimeMessage<TPayload = unknown> {
  type: string;
  scope?: string | null;
  occurredAt?: string;
  payload?: TPayload;
}

export type RealtimeMessageHandler = (message: RealtimeMessage) => void;
