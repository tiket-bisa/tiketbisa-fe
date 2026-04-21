import { useState, useCallback } from "react";
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

  const handleScan = useCallback(
    async (decodedText: string) => {
      setIsLoading(true);

      // QR codes: TKB<UUID (36 chars)><12-char hash> = 51 chars
      // Barcodes: TKB<UUID (36 chars)><6 digits> = 45 chars
      const codeType = decodedText.length > 45 ? "QR_CODE" : "BARCODE";

      const response = await checkinApi.checkIn({
        code_hash: decodedText,
        code_type: codeType as "QR_CODE" | "BARCODE",
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
          ticket_id: decodedText.substring(0, 20),
          status,
          message: response.error ?? undefined,
        });
      }

      setIsLoading(false);
    },
    [user?.email],
  );

  const clearResult = useCallback(() => setScanResult(null), []);

  return { scanResult, isLoading, handleScan, clearResult };
}
