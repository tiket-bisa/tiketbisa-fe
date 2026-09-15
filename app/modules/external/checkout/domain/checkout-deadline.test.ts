import { describe, expect, it } from "vitest";

import { resolveCheckoutDeadline } from "./checkout-deadline";

const NOW = 1_800_000_000_000;

function ttl(remainingSeconds: number, expiresAt = 0, status = "ACTIVE") {
  return { status, remainingSeconds, expiresAt, serverTime: NOW } as never;
}

describe("resolveCheckoutDeadline", () => {
  it("derives a deadline from the remaining seconds when the backend sends no absolute expiry", () => {
    expect(
      resolveCheckoutDeadline({ ttl: ttl(600), storedDeadline: null, now: NOW, authoritative: false }),
    ).toBe(NOW + 600_000);
  });

  it("prefers the backend's absolute expiry over the derived one", () => {
    expect(
      resolveCheckoutDeadline({ ttl: ttl(600, NOW + 300_000), storedDeadline: null, now: NOW, authoritative: false }),
    ).toBe(NOW + 300_000);
  });

  it("never lets a deadline drift forward while a phase is still running", () => {
    // A later poll reporting a fresh full window must not hand the buyer extra time.
    expect(
      resolveCheckoutDeadline({
        ttl: ttl(600),
        storedDeadline: NOW + 120_000,
        now: NOW,
        authoritative: false,
      }),
    ).toBe(NOW + 120_000);
  });

  it("takes the longer payment window when the reservation really was extended", () => {
    // Entering the payment phase re-locks to the gateway invoice lifetime. Clamping to the
    // details deadline here would run the countdown out on a live invoice.
    expect(
      resolveCheckoutDeadline({
        ttl: ttl(1200),
        storedDeadline: NOW + 120_000,
        now: NOW,
        authoritative: true,
      }),
    ).toBe(NOW + 1_200_000);
  });

  it("ignores a stored deadline that has already passed", () => {
    expect(
      resolveCheckoutDeadline({
        ttl: ttl(600),
        storedDeadline: NOW - 1,
        now: NOW,
        authoritative: false,
      }),
    ).toBe(NOW + 600_000);
  });

  it("returns null when the reservation is gone, so no timer is shown", () => {
    expect(
      resolveCheckoutDeadline({ ttl: ttl(0), storedDeadline: NOW + 120_000, now: NOW, authoritative: false }),
    ).toBe(null);
    expect(
      resolveCheckoutDeadline({ ttl: ttl(600, 0, "EXPIRED"), storedDeadline: null, now: NOW, authoritative: false }),
    ).toBe(null);
  });
});
