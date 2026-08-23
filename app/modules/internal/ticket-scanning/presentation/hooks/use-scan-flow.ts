import { useCallback, useRef, useState } from "react";
import type { ScanCheckInResult, ScanValidateResult } from "~/core/types";
import {
  checkinApi,
  type CheckInResponse,
  type ScanCodeType,
  type ValidateResponse,
} from "../../infrastructure/checkin.api";
import { useAuth } from "~/core/auth";
import { toUserFacingError, toUserFacingResponseError } from "~/core/api";

/**
 * Two-phase scan flow:
 *  1. `handleScan` calls the read-only validate endpoint and shows a status
 *     (VALID / INVALID / ALREADY_CHECKED_IN / WRONG_CATEGORY) without mutating anything.
 *  2. When status is VALID, the operator explicitly clicks "Check In" which calls
 *     `confirmCheckIn` (the existing mutating checkin endpoint).
 */
export function useScanFlow(expectedEventId?: string, expectedCategoryId?: string) {
  const { user } = useAuth();
  const [validateResult, setValidateResult] = useState<ScanValidateResult | null>(null);
  const [checkInResult, setCheckInResult] = useState<ScanCheckInResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const isBusyRef = useRef(false);

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (isBusyRef.current) return;
      const normalizedCode = decodedText.trim();
      if (!normalizedCode) return;

      isBusyRef.current = true;
      setIsValidating(true);
      setCheckInResult(null);

      const codeType = detectCodeType(normalizedCode);

      try {
        const response = await checkinApi.validate(
          normalizedCode, codeType, expectedEventId, expectedCategoryId,
        );

        if (response.success && response.data) {
          const data = response.data as ValidateResponse;
          setValidateResult({
            status: data.status,
            holderName: data.holder_name,
            ticketCategoryName: data.ticket_category_name,
            checkInTime: data.check_in_time,
            source: data.source,
            partner: data.partner,
            message: data.message,
            codeHash: normalizedCode,
            codeType,
          });
        } else {
          setValidateResult(
            buildValidateFailure(
              normalizedCode,
              codeType,
              response.status_code,
              toUserFacingResponseError(response, "Tiket tidak dapat divalidasi."),
            ),
          );
        }
      } catch (error) {
        setValidateResult({
          status: "INVALID",
          message: toUserFacingError(error, "Gagal memproses scan."),
          codeHash: normalizedCode,
          codeType,
        });
      } finally {
        isBusyRef.current = false;
        setIsValidating(false);
      }
    },
    [expectedEventId, expectedCategoryId],
  );

  const confirmCheckIn = useCallback(async () => {
    if (!validateResult || validateResult.status !== "VALID") return;
    if (isBusyRef.current) return;

    isBusyRef.current = true;
    setIsCheckingIn(true);

    try {
      const response = await checkinApi.checkIn({
        code_hash: validateResult.codeHash,
        code_type: validateResult.codeType,
        verify_by: user?.email ?? "unknown",
        expected_event_id: expectedEventId,
        expected_category_id: expectedCategoryId,
      });

      if (response.success) {
        const data = response.data as CheckInResponse;
        setCheckInResult({
          status: "SUCCESS",
          checkInTime: data.checkInTime ?? data.check_in_time,
          message: data.message,
        });
      } else {
        setCheckInResult({
          status: "FAILED",
          message: toUserFacingResponseError(response, "Check-in gagal, silakan coba lagi."),
        });
      }
    } catch (error) {
      setCheckInResult({
        status: "FAILED",
        message: toUserFacingError(error, "Check-in gagal, silakan coba lagi."),
      });
    } finally {
      isBusyRef.current = false;
      setIsCheckingIn(false);
    }
  }, [validateResult, user?.email, expectedEventId, expectedCategoryId]);

  const clearResult = useCallback(() => {
    setValidateResult(null);
    setCheckInResult(null);
  }, []);

  return {
    validateResult,
    checkInResult,
    isValidating,
    isCheckingIn,
    isBusy: isValidating || isCheckingIn,
    handleScan,
    confirmCheckIn,
    clearResult,
  };
}

export function detectCodeType(code: string): ScanCodeType {
  if (!code.startsWith("TKB")) return "QR_CODE";
  if (/^TKB[A-Za-z0-9\-_]+$/.test(code)) return "QR_CODE";
  return code.length > 45 ? "QR_CODE" : "BARCODE";
}

export function buildValidateFailure(
  code: string,
  codeType: ScanCodeType,
  statusCode?: number,
  error?: string | null,
): ScanValidateResult {
  const message = error || "";
  const normalizedMessage = message.toLowerCase();
  let status: ScanValidateResult["status"] = "INVALID";
  let fallbackMessage = "Tiket tidak terdeteksi atau kode QR/barcode tidak valid.";

  if (statusCode === 409) {
    if (normalizedMessage.includes("already")) {
      status = "ALREADY_CHECKED_IN";
      fallbackMessage = "Tiket ini sudah pernah di-scan.";
    } else if (normalizedMessage.includes("category") || normalizedMessage.includes("kategori")) {
      // Backend's category-mismatch message is Indonesian ("Kategori tidak sesuai...").
      status = "WRONG_CATEGORY";
      fallbackMessage = "Tiket ini tidak sesuai dengan kategori yang dipilih.";
    }
  } else if (statusCode === 404 || normalizedMessage.includes("not found")) {
    fallbackMessage = "Tiket tidak terdeteksi di sistem.";
  } else if (statusCode === 403 || normalizedMessage.includes("forbidden")) {
    fallbackMessage = "Akun ini tidak punya akses untuk scan tiket event tersebut.";
  } else if (normalizedMessage.includes("invalid")) {
    fallbackMessage = "Kode QR/barcode tidak dikenali sebagai tiket yang valid.";
  }

  return {
    status,
    message: message || fallbackMessage,
    codeHash: code,
    codeType,
  };
}
