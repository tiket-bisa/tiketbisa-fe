import { useRef, useState, useCallback } from "react";
import type { TicketScanResult } from "~/core/types";
import {
  checkinApi,
  type CheckInResponse,
} from "../../infrastructure/checkin.api";
import { useAuth } from "~/core/auth";
import { toUserFacingError, toUserFacingResponseError } from "~/core/api";

export function useCheckIn() {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState<TicketScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (isLoadingRef.current) return;
      const normalizedCode = decodedText.trim();
      if (!normalizedCode) return;
      isLoadingRef.current = true;
      setIsLoading(true);

      const codeType = detectCodeType(normalizedCode);

      try {
        const response = await checkinApi.checkIn({
          code_hash: normalizedCode,
          code_type: codeType,
          verify_by: user?.email ?? "unknown",
        });

        if (response.success) {
          const data = response.data as CheckInResponse;
          setScanResult({
            ticket_id: data.ticketId ?? data.id ?? normalizedCode.substring(0, 20),
            status: "valid",
            checked_in_at: data.checkInTime ?? data.check_in_time,
            message: data.message,
          });
        } else {
          setScanResult(buildFailureResult(
            normalizedCode,
            response.status_code,
            toUserFacingResponseError(response, "Tiket tidak dapat diproses."),
          ));
        }
      } catch (error) {
        setScanResult({
          ticket_id: normalizedCode.substring(0, 20),
          status: "invalid",
          message: toUserFacingError(error, "Gagal memproses scan."),
        });
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [user?.email],
  );

  const clearResult = useCallback(() => setScanResult(null), []);

  return { scanResult, isLoading, handleScan, clearResult };
}

function detectCodeType(code: string): "QR_CODE" | "BARCODE" {
  if (!code.startsWith("TKB")) return "QR_CODE";
  if (/^TKB[A-Za-z0-9\-_]+$/.test(code)) return "QR_CODE";
  return code.length > 45 ? "QR_CODE" : "BARCODE";
}

function buildFailureResult(
  code: string,
  statusCode?: number,
  error?: string | null,
): TicketScanResult {
  const message = error || "";
  const normalizedMessage = message.toLowerCase();
  let status: TicketScanResult["status"] = "invalid";
  let fallbackMessage = "Tiket tidak terdeteksi atau kode QR/barcode tidak valid.";

  if (statusCode === 409) {
    if (normalizedMessage.includes("already")) {
      status = "already_checked_in";
      fallbackMessage = "Tiket ini sudah pernah di-scan.";
    } else if (
      normalizedMessage.includes("not active") ||
      normalizedMessage.includes("expired") ||
      normalizedMessage.includes("waiting") ||
      normalizedMessage.includes("cancel")
    ) {
      status = "expired";
      fallbackMessage = "Tiket belum aktif, kedaluwarsa, atau tidak bisa digunakan untuk check-in.";
    }
  } else if (statusCode === 404 || normalizedMessage.includes("not found")) {
    fallbackMessage = "Tiket tidak terdeteksi di sistem.";
  } else if (statusCode === 403 || normalizedMessage.includes("forbidden")) {
    fallbackMessage = "Akun ini tidak punya akses untuk scan tiket event tersebut.";
  } else if (normalizedMessage.includes("invalid")) {
    fallbackMessage = "Kode QR/barcode tidak dikenali sebagai tiket yang valid.";
  }

  return {
    ticket_id: code.substring(0, 20),
    status,
    message: message || fallbackMessage,
  };
}
