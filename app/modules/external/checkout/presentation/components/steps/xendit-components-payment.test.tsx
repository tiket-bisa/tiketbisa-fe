// @vitest-environment jsdom

import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { XenditComponentsRealPayment } from "./xendit-components-payment";

const sdk = vi.hoisted(() => {
  const listeners = new Map<string, (event?: Event) => void>();
  return {
    listeners,
    addEventListener: vi.fn((name: string, listener: (event?: Event) => void) => listeners.set(name, listener)),
    removeEventListener: vi.fn((name: string) => listeners.delete(name)),
    getActiveChannels: vi.fn(() => [{ channelCode: "QRIS" }]),
    createChannelPickerComponent: vi.fn(() => document.createElement("div")),
    createChannelComponent: vi.fn(() => document.createElement("div")),
    createActionContainerComponent: vi.fn(() => document.createElement("div")),
    showValidationErrors: vi.fn(),
    submit: vi.fn(),
    pollImmediately: vi.fn(),
    abortSubmission: vi.fn(),
    destroyComponent: vi.fn(),
  };
});

vi.mock("xendit-components-web", () => ({
  XenditComponents: vi.fn(function MockComponents() { return sdk; }),
}));

describe("XenditComponentsRealPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sdk.listeners.clear();
  });

  it("mounts QRIS directly and submits without a second method picker", () => {
    render(
      <XenditComponentsRealPayment
        componentsSdkKey="session-key"
        paymentMethodId="qris"
        deadline="12.45"
        onCheckStatus={vi.fn()}
        onBack={vi.fn()}
        onExpire={vi.fn()}
      />,
    );

    act(() => sdk.listeners.get("init")?.());
    act(() => sdk.listeners.get("submission-ready")?.());
    fireEvent.click(screen.getByRole("button", { name: "Tampilkan QRIS" }));

    expect(sdk.getActiveChannels).toHaveBeenCalledWith({ filter: "QRIS" });
    expect(sdk.createChannelComponent).toHaveBeenCalledTimes(1);
    expect(sdk.createChannelPickerComponent).not.toHaveBeenCalled();
    expect(sdk.submit).toHaveBeenCalledTimes(1);
  });

  it("uses the SDK bank picker for a one-time dynamic VA", () => {
    render(
      <XenditComponentsRealPayment
        componentsSdkKey="session-key"
        paymentMethodId="va"
        deadline="12.45"
        onCheckStatus={vi.fn()}
        onBack={vi.fn()}
        onExpire={vi.fn()}
      />,
    );

    act(() => sdk.listeners.get("init")?.());

    expect(sdk.createChannelPickerComponent).toHaveBeenCalledTimes(1);
    expect((screen.getByRole("button", { name: "Buat Nomor Virtual Account" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("does not trust the client completion event as payment proof", () => {
    const onCheckStatus = vi.fn();
    render(
      <XenditComponentsRealPayment
        componentsSdkKey="session-key"
        paymentMethodId="qris"
        deadline="12.45"
        onCheckStatus={onCheckStatus}
        onBack={vi.fn()}
        onExpire={vi.fn()}
      />,
    );

    act(() => sdk.listeners.get("session-complete")?.());

    expect(onCheckStatus).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Menunggu konfirmasi pembayaran…")).toBeTruthy();
  });
});
