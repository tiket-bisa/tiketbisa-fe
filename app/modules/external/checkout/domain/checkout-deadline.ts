import type { CheckoutTtl } from "../infrastructure/order.api";

export interface ResolveDeadlineInput {
  ttl: CheckoutTtl;
  storedDeadline: number | null;
  now: number;
  authoritative: boolean;
}

export function resolveCheckoutDeadline({
  ttl,
  storedDeadline,
  now,
  authoritative,
}: ResolveDeadlineInput): number | null {
  if (ttl.status !== "ACTIVE" || ttl.remainingSeconds <= 0) {
    return null;
  }

  const backendDeadline = ttl.expiresAt > 0
    ? ttl.expiresAt
    : now + ttl.remainingSeconds * 1000;

  const hasUsableStored = storedDeadline !== null
    && Number.isFinite(storedDeadline)
    && storedDeadline > now;

  if (authoritative || !hasUsableStored) {
    return backendDeadline;
  }
  return Math.min(storedDeadline as number, backendDeadline);
}
