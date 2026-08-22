// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ticketDeliveryApi } from "../../infrastructure/ticket-delivery.api";
import { useTicketArchiveActions } from "./use-ticket-archive-actions";

const errorToast = vi.fn();
const infoToast = vi.fn();
const successToast = vi.fn();

vi.mock("~/core/design-system/components", () => ({
  useToast: () => ({ error: errorToast, info: infoToast, success: successToast }),
}));

vi.mock("../../infrastructure/ticket-delivery.api", () => ({
  ticketDeliveryApi: { downloadArchive: vi.fn() },
}));

const downloadArchive = vi.mocked(ticketDeliveryApi.downloadArchive);

describe("useTicketArchiveActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    downloadArchive.mockResolvedValue({
      blob: new Blob(["zip"], { type: "application/zip" }),
      fileName: "tickets-order-1.zip",
    });
    Object.defineProperty(globalThis, "isSecureContext", { value: true, configurable: true });
  });

  it("prefetches once and shares the prepared ZIP from the click handler", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });

    const { result } = renderHook(() => useTicketArchiveActions("order-1", "ticket-code"));

    await waitFor(() => expect(result.current.isArchiveReady).toBe(true));
    expect(downloadArchive).toHaveBeenCalledTimes(1);

    act(() => result.current.share());

    expect(share).toHaveBeenCalledTimes(1);
    expect(share.mock.calls[0][0].files[0]).toBeInstanceOf(File);
    expect(share.mock.calls[0][0].files[0].name).toBe("tickets-order-1.zip");
    await waitFor(() => expect(result.current.activeAction).toBeNull());
  });

  it("shows an actionable message when Chrome denies Web Share permission", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("Permission denied", "NotAllowedError"));
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });

    const { result } = renderHook(() => useTicketArchiveActions("order-1", "ticket-code"));
    await waitFor(() => expect(result.current.isArchiveReady).toBe(true));

    act(() => result.current.share());

    await waitFor(() => expect(errorToast).toHaveBeenCalledWith(
      "Izin berbagi ditolak. Pastikan halaman dibuka melalui HTTPS lalu coba lagi.",
    ));
  });
});
