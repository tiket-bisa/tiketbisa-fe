// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ticketDeliveryApi } from "../../infrastructure/ticket-delivery.api";
import { useTicketArchiveActions } from "./use-ticket-archive-actions";

const errorToast = vi.fn();
const successToast = vi.fn();

vi.mock("~/core/design-system/components", () => ({
  useToast: () => ({ error: errorToast, success: successToast }),
}));

vi.mock("../../infrastructure/ticket-delivery.api", () => ({
  ticketDeliveryApi: { downloadArchive: vi.fn() },
}));

const downloadArchive = vi.mocked(ticketDeliveryApi.downloadArchive);
const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

describe("useTicketArchiveActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    downloadArchive.mockResolvedValue({
      blob: new Blob(["zip"], { type: "application/zip" }),
      fileName: "tickets-order-1.zip",
    });
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn(() => "blob:ticket"),
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: vi.fn(),
      configurable: true,
    });
  });

  it("downloads the ticket archive only after the user requests it", async () => {
    const { result } = renderHook(() => useTicketArchiveActions("order-1", "ticket-code"));

    expect(downloadArchive).not.toHaveBeenCalled();
    await act(async () => result.current.download());

    expect(downloadArchive).toHaveBeenCalledWith("order-1", "ticket-code");
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(successToast).toHaveBeenCalledWith("File tiket berhasil diunduh.");
    expect(errorToast).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.isDownloading).toBe(false));
  });

  it("shows a safe message when the archive cannot be downloaded", async () => {
    downloadArchive.mockRejectedValue(new TypeError("Network request failed"));
    const { result } = renderHook(() => useTicketArchiveActions("order-1", "ticket-code"));

    await act(async () => result.current.download());

    expect(anchorClick).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalled();
    expect(successToast).not.toHaveBeenCalled();
  });
});
