import { useRef, useState, useCallback } from "react";
import type { TicketScanResult } from "~/core/types";
import {
  checkinApi,
  type CheckInResponse,
} from "../../infrastructure/checkin.api";
import { useAuth } from "~/core/auth";

export interface CheckInContext {
  eventId: string;
  ticketCategoryId: string;
}

export function useCheckIn() {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState<TicketScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);

  const handleScan = useCallback(
    async (decodedText: string, context: CheckInContext) => {
      if (isLoadingRef.current) return;
      const normalizedCode = decodedText.trim();
      if (!normalizedCode) return;
      if (!context.eventId || !context.ticketCategoryId) {
        setScanResult({
          ticket_id: normalizedCode.substring(0, 20),
          status: "invalid",
          message: "Pilih event dan kategori tiket sebelum scan.",
        });
        return;
      }

      isLoadingRef.current = true;
      setIsLoading(true);

      const codeType = detectCodeType(normalizedCode);

      try {
        const response = await checkinApi.checkIn({
          code_hash: normalizedCode,
          code_type: codeType,
          verify_by: user?.email ?? "unknown",
          event_id: context.eventId,
          ticket_category_id: context.ticketCategoryId,
        });

        if (response.success) {
          const data = response.data as CheckInResponse;
          setScanResult({
            ticket_id: data.ticket_id ?? data.ticketId ?? data.id ?? normalizedCode.substring(0, 20),
            event_name: data.event_name ?? data.eventName,
            ticket_name: data.ticket_category_name ?? data.ticketCategoryName,
            buyer_name: data.buyer_name ?? data.buyerName,
            status: "valid",
            checked_in_at: data.checkInTime ?? data.check_in_time,
            message: data.message,
          });
        } else {
          setScanResult(buildFailureResult(
            normalizedCode,
            response.status_code,
            response.error,
          ));
        }
      } catch (error) {
        setScanResult({
          ticket_id: normalizedCode.substring(0, 20),
          status: "invalid",
          message: error instanceof Error ? error.message : "Gagal memproses scan",
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
