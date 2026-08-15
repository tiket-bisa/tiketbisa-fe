// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CountdownTimer } from "./countdown-timer";

describe("CountdownTimer", () => {
  beforeEach(() => sessionStorage.clear());

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
});
