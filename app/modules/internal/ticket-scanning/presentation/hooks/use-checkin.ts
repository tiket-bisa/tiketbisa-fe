import { useRef, useState, useCallback } from "react";
import type { TicketScanResult } from "~/core/types";
import {
  checkinApi,
  type CheckInResponse,
} from "../../infrastructure/checkin.api";
import { useAuth } from "~/core/auth";

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
            ticket_id: data.ticketId,
            status: "valid",
            checked_in_at: data.checkInTime,
            message: data.message,
          });
        } else {
          let status: TicketScanResult["status"] = "invalid";
          if (response.status_code === 409) {
            status = "already_checked_in";
          }

          setScanResult({
            ticket_id: normalizedCode.substring(0, 20),
            status,
            message: response.error ?? undefined,
          });
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
