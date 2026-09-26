// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CountdownTimer } from "./countdown-timer";

describe("CountdownTimer", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.useRealTimers());

  it("does not invent a local deadline when backend TTL has not been synced", () => {
    const { container } = render(<CountdownTimer />);
    expect(container.textContent).toBe("");
    expect(sessionStorage.getItem("tiketbisa_checkout_deadline")).toBeNull();
  });

  it("renders a backend-synced deadline", () => {
    sessionStorage.setItem("tiketbisa_checkout_deadline", String(Date.now() + 90_000));
    render(<CountdownTimer />);
    expect(screen.getByText(/01:(?:2[89]|30)/)).toBeTruthy();
  });

  it("switches from the buyer deadline to the authoritative payment deadline", () => {
    const now = Date.now();
    const { container, rerender } = render(<CountdownTimer deadlineTimestamp={now + 300_000} />);
    expect(container.textContent).toMatch(/(?:05:00|04:59)/);

    rerender(<CountdownTimer deadlineTimestamp={now + 900_000} />);
    expect(container.textContent).toMatch(/(?:15:00|14:59)/);
  });

  it("notifies expiry only once when the callback identity changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-27T00:00:00.000Z"));
    const firstOnExpire = vi.fn();
    const secondOnExpire = vi.fn();
    const deadline = Date.now() + 1_000;
    const { rerender } = render(
      <CountdownTimer deadlineTimestamp={deadline} onExpire={firstOnExpire} />,
    );

    act(() => vi.advanceTimersByTime(1_000));
    expect(firstOnExpire).toHaveBeenCalledTimes(1);

    rerender(<CountdownTimer deadlineTimestamp={deadline} onExpire={secondOnExpire} />);
    act(() => vi.advanceTimersByTime(2_000));

    expect(firstOnExpire).toHaveBeenCalledTimes(1);
    expect(secondOnExpire).not.toHaveBeenCalled();
  });
});
