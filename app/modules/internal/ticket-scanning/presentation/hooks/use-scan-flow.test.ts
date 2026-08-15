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

    const { result } = renderHook(() => useScanFlow("event-1", "cat-1"));

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
    expect(mockValidate).toHaveBeenCalledWith("TKBsomecode123", "QR_CODE", "event-1", "cat-1");

    await act(async () => {
      await result.current.confirmCheckIn();
    });

    expect(mockCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({
        code_hash: "TKBsomecode123",
        code_type: "QR_CODE",
        expected_event_id: "event-1",
        expected_category_id: "cat-1",
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
});
