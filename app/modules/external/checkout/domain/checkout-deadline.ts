import type { CheckoutTtl } from "../infrastructure/order.api";

export interface ResolveDeadlineInput {
  ttl: CheckoutTtl;
  /** Deadline currently held in session storage, or null/NaN when there is none. */
  storedDeadline: number | null;
  now: number;
  /**
   * The backend deadline replaces whatever is stored, rather than only ever shortening it.
   *
   * <p>Checkout reserves in two phases: a short lock while the buyer fills in details, then a
   * longer one covering the gateway invoice. Clamping to the stored value is right within a
   * phase — it stops a deadline drifting forward on every poll — but wrong across the boundary,
   * where the reservation genuinely was extended. Clamping there would run the details countdown
   * out while the buyer's invoice is still live.
   */
  authoritative: boolean;
}

/**
 * The timestamp the checkout countdown should run against, or null when there is no live
 * reservation and the timer must not render at all.
 */
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
