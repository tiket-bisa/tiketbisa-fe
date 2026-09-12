// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkinApi, type CheckInResponse } from "../../infrastructure/checkin.api";
import { buildValidateFailure, detectCodeType, useScanFlow } from "./use-scan-flow";

vi.mock("~/core/auth", () => ({
  useAuth: () => ({ user: { email: "scanner@tiketbisa.com" } }),
}));

vi.mock("../../infrastructure/checkin.api", () => ({
  checkinApi: {
    validate: vi.fn(),
    checkIn: vi.fn(),
  },
}));

const mockValidate = vi.mocked(checkinApi.validate);
const mockCheckIn = vi.mocked(checkinApi.checkIn);

describe("detectCodeType", () => {
  it("detects TKB-prefixed alphanumeric codes as QR_CODE", () => {
    expect(detectCodeType("TKBabc123-def_456")).toBe("QR_CODE");
  });

  it("falls back to BARCODE for short non-TKB-pattern codes", () => {
    expect(detectCodeType("TKB!!!123")).toBe("BARCODE");
  });
});

describe("buildValidateFailure", () => {
  it("maps a 409 'already checked in' error to ALREADY_CHECKED_IN", () => {
    const result = buildValidateFailure("TKB123", "QR_CODE", 409, "Ticket already checked in");
    expect(result.status).toBe("ALREADY_CHECKED_IN");
  });

  it("maps a 409 category mismatch error to WRONG_CATEGORY", () => {
    const result = buildValidateFailure("TKB123", "QR_CODE", 409, "wrong category for this ticket");
    expect(result.status).toBe("WRONG_CATEGORY");
  });

  it("defaults to INVALID for unrecognized errors", () => {
    const result = buildValidateFailure("TKB123", "QR_CODE", 404, "not found");
    expect(result.status).toBe("INVALID");
  });
});

describe("useScanFlow state machine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retains the completed result until a different ticket finishes validation", async () => {
    mockValidate.mockResolvedValue({ success: true, data: { status: "VALID" }, error: null, reason: null, status_code: 200 });
    mockCheckIn.mockResolvedValue({ success: true, data: {}, error: null, reason: null, status_code: 200 });
    const { result } = renderHook(() => useScanFlow("event", ["A", "B"]));
    await act(async () => { await result.current.handleScan("first"); });
    await act(async () => { await result.current.confirmCheckIn(); });
    await act(async () => { await result.current.handleScan("first"); });
    expect(mockValidate).toHaveBeenCalledTimes(1);
    let resolve!: (value: Awaited<ReturnType<typeof checkinApi.validate>>) => void;
    mockValidate.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    let pending!: Promise<void>;
    act(() => { pending = result.current.handleScan("second"); });
    expect(result.current.checkInResult?.status).toBe("SUCCESS");
    expect(result.current.validateResult?.codeHash).toBe("first");
    await act(async () => {
      resolve({ success: true, data: { status: "VALID" }, error: null, reason: null, status_code: 200 });
      await pending;
    });
    expect(result.current.checkInResult).toBeNull();
    expect(result.current.validateResult?.codeHash).toBe("second");
  });

  it("ignores an old response after the operator changes scope", async () => {
    let resolve!: (value: Awaited<ReturnType<typeof checkinApi.validate>>) => void;
    mockValidate.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const { result, rerender } = renderHook(({ event }) => useScanFlow(event, ["A"]), { initialProps: { event: "old" } });
    let pending!: Promise<void>;
    act(() => { pending = result.current.handleScan("first"); });
    rerender({ event: "new" });
    await act(async () => {
      resolve({ success: true, data: { status: "VALID" }, error: null, reason: null, status_code: 200 });
      await pending;
    });
    expect(result.current.validateResult).toBeNull();
    expect(result.current.isBusy).toBe(false);
  });

  it("does not allow check-in until a VALID validate result is present, then transitions to SUCCESS", async () => {
    mockValidate.mockResolvedValueOnce({
      success: true,
      data: {
        status: "VALID",
        holder_name: "Budi",
        ticket_category_name: "Regular",
      },
      error: null,
      reason: null,
      status_code: 200,
    });
    mockCheckIn.mockResolvedValueOnce({
      success: true,
      data: { checkInTime: "2026-07-03T10:00:00Z" },
      error: null,
      reason: null,
      status_code: 200,
    });

    const { result } = renderHook(() => useScanFlow("event-1", ["cat-1", "cat-2"]));

    // Calling confirmCheckIn before any validate result is a no-op.
    await act(async () => {
      await result.current.confirmCheckIn();
    });
    expect(mockCheckIn).not.toHaveBeenCalled();
    expect(result.current.checkInResult).toBeNull();

    await act(async () => {
      await result.current.handleScan("TKBsomecode123");
    });

    await waitFor(() => {
      expect(result.current.validateResult?.status).toBe("VALID");
    });
    expect(mockValidate).toHaveBeenCalledWith("TKBsomecode123", "QR_CODE", "event-1", ["cat-1", "cat-2"]);

    await act(async () => {
      await result.current.confirmCheckIn();
    });

    expect(mockCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({
        code_hash: "TKBsomecode123",
        code_type: "QR_CODE",
        expected_event_id: "event-1",
        expected_category_ids: ["cat-1", "cat-2"],
      }),
    );
    await waitFor(() => {
      expect(result.current.checkInResult?.status).toBe("SUCCESS");
    });
  });

  it("surfaces FAILED check-in without mutating the validate result", async () => {
    mockValidate.mockResolvedValueOnce({
      success: true,
      data: { status: "VALID" },
      error: null,
      reason: null,
      status_code: 200,
    });
    mockCheckIn.mockResolvedValueOnce({
      success: false,
      data: null as unknown as CheckInResponse,
      error: "Ticket already used",
      reason: "CONFLICT",
      status_code: 409,
    });

    const { result } = renderHook(() => useScanFlow());

    await act(async () => {
      await result.current.handleScan("TKBanother456");
    });
    await waitFor(() => {
      expect(result.current.validateResult?.status).toBe("VALID");
    });

    await act(async () => {
      await result.current.confirmCheckIn();
    });

    await waitFor(() => {
      expect(result.current.checkInResult?.status).toBe("FAILED");
    });
    expect(result.current.checkInResult?.message).toBe("Ticket already used");
    expect(result.current.validateResult?.status).toBe("VALID");
  });

  it("replaces the visible result when a different ticket is scanned", async () => {
    mockValidate
      .mockResolvedValueOnce({
        success: true,
        data: { status: "VALID", holder_name: "Budi" },
        error: null,
        reason: null,
        status_code: 200,
      })
      .mockResolvedValueOnce({
        success: true,
        data: { status: "VALID", holder_name: "Siti" },
        error: null,
        reason: null,
        status_code: 200,
      });

    const { result } = renderHook(() => useScanFlow("event-1", ["cat-1"]));

    await act(async () => result.current.handleScan("ticket-a"));
    expect(result.current.validateResult?.holderName).toBe("Budi");

    await act(async () => result.current.handleScan("ticket-b"));
    expect(result.current.validateResult?.holderName).toBe("Siti");
    expect(result.current.validateResult?.codeHash).toBe("ticket-b");
  });

  describe("auto check-in", () => {
    it("checks in a VALID ticket without an explicit confirm", async () => {
      mockValidate.mockResolvedValueOnce({
        success: true,
        data: { status: "VALID", holder_name: "Budi", ticket_category_name: "VIP" },
        error: null,
        reason: null,
        status_code: 200,
      });
      mockCheckIn.mockResolvedValueOnce({
        success: true,
        data: { checkInTime: "2026-07-03T10:00:00Z" },
        error: null,
        reason: null,
        status_code: 200,
      });

      const { result } = renderHook(() => useScanFlow("event-1", ["cat-1"], true));

      await act(async () => { await result.current.handleScan("TKBauto123"); });

      await waitFor(() => {
        expect(result.current.checkInResult?.status).toBe("SUCCESS");
      });
      expect(mockCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({
          code_hash: "TKBauto123",
          expected_event_id: "event-1",
          expected_category_ids: ["cat-1"],
        }),
      );
      // The validate result still drives the card, so holder/category stay visible.
      expect(result.current.validateResult?.holderName).toBe("Budi");
      expect(result.current.validateResult?.ticketCategoryName).toBe("VIP");
      expect(result.current.isBusy).toBe(false);
    });

    it("does not check in a ticket that is not VALID", async () => {
      mockValidate.mockResolvedValueOnce({
        success: true,
        data: { status: "WRONG_CATEGORY", ticket_category_name: "Regular" },
        error: null,
        reason: null,
        status_code: 200,
      });

      const { result } = renderHook(() => useScanFlow("event-1", ["cat-1"], true));

      await act(async () => { await result.current.handleScan("TKBwrongcat"); });

      expect(mockCheckIn).not.toHaveBeenCalled();
      expect(result.current.validateResult?.status).toBe("WRONG_CATEGORY");
      expect(result.current.checkInResult).toBeNull();
    });

    it("stays locked while the chained check-in is in flight", async () => {
      mockValidate.mockResolvedValue({
        success: true,
        data: { status: "VALID" },
        error: null,
        reason: null,
        status_code: 200,
      });
      let resolveCheckIn!: (value: Awaited<ReturnType<typeof checkinApi.checkIn>>) => void;
      mockCheckIn.mockImplementationOnce(() => new Promise((done) => { resolveCheckIn = done; }));

      const { result } = renderHook(() => useScanFlow("event-1", ["cat-1"], true));

      let pending!: Promise<void>;
      await act(async () => {
        pending = result.current.handleScan("TKBfirst");
        await Promise.resolve();
      });

      // A second frame decoded while check-in is still running must not start another validate.
      await act(async () => { await result.current.handleScan("TKBsecond"); });
      expect(mockValidate).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveCheckIn({ success: true, data: {}, error: null, reason: null, status_code: 200 });
        await pending;
      });
      expect(result.current.isBusy).toBe(false);
    });

    it("surfaces a FAILED auto check-in and keeps the validate result", async () => {
      mockValidate.mockResolvedValueOnce({
        success: true,
        data: { status: "VALID" },
        error: null,
        reason: null,
        status_code: 200,
      });
      mockCheckIn.mockResolvedValueOnce({
        success: false,
        data: null as unknown as CheckInResponse,
        error: "Kategori tidak sesuai. Tiket ini termasuk kategori: Regular",
        reason: "CONFLICT",
        status_code: 409,
      });

      const { result } = renderHook(() => useScanFlow("event-1", ["cat-1"], true));

      await act(async () => { await result.current.handleScan("TKBraced"); });

      await waitFor(() => {
        expect(result.current.checkInResult?.status).toBe("FAILED");
      });
      expect(result.current.validateResult?.status).toBe("VALID");
    });
  });
});
