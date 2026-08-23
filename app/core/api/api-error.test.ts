import { describe, expect, it } from "vitest";
import {
  ApiRequestError,
  sanitizeApiEnvelope,
  toUserFacingError,
  toUserFacingResponseError,
} from "./api-error";

describe("API error sanitization", () => {
  it("preserves actionable business validation", () => {
    const response = sanitizeApiEnvelope({
      success: false,
      status_code: 400,
      data: null,
      error: { code: "900", message: "NIK harus 16 digit angka" },
      request_id: "request-400",
    });

    expect(response.error).toBe("NIK harus 16 digit angka");
  });

  it.each([
    "Xendit returned BANK_NOT_ACTIVATED",
    "Redis connection failed at internal-host",
    "Invalid JSON response from server",
    "SQL constraint transaction_gateway_ref_key",
  ])("hides technical server detail: %s", (technicalMessage) => {
    const response = sanitizeApiEnvelope({
      success: false,
      status_code: 500,
      data: null,
      error: { code: "900", message: technicalMessage },
      request_id: "request-500",
    });

    expect(response.error).toBe(
      "Permintaan tidak dapat diproses. Silakan coba lagi. Kode referensi: request-500.",
    );
    expect(response.error).not.toContain(technicalMessage);
  });

  it("uses a safe fallback for unknown runtime errors", () => {
    expect(toUserFacingError(new Error("database password leaked"), "Data gagal dimuat."))
      .toBe("Data gagal dimuat.");
  });

  it("retains an already-sanitized API error", () => {
    const error = new ApiRequestError(
      "Transaksi gagal. Kode referensi: request-1.",
      { requestId: "request-1", statusCode: 500 },
    );
    expect(toUserFacingError(error, "Fallback")).toBe(error.message);
  });

  it("formats sanitized response failures for UI consumers", () => {
    expect(toUserFacingResponseError({
      success: false,
      status_code: 503,
      error: "upstream refused connection",
      request_id: "request-503",
    }, "Gagal menyimpan data."))
      .toBe("Permintaan tidak dapat diproses. Silakan coba lagi. Kode referensi: request-503.");
  });
});
