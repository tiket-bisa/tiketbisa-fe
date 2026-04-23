import { useState, useRef, useCallback, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface UseQrScannerOptions {
  onScanSuccess: (decodedText: string) => void;
}

export function useQrScanner({ onScanSuccess }: UseQrScannerOptions) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  onScanSuccessRef.current = onScanSuccess;

  const scannerElementId = "qr-scanner-region";

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      const scanner = new Html5Qrcode(scannerElementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 350, height: 150 },
          aspectRatio: 16 / 9,
        },
        (decodedText) => {
          if (decodedText === lastScannedRef.current) return;
          lastScannedRef.current = decodedText;
          onScanSuccessRef.current(decodedText);
          setTimeout(() => {
            lastScannedRef.current = null;
          }, 3000);
        },
        () => {
          // No QR code found in frame — normal, ignore
        },
      );

      setIsScanning(true);
    } catch {
      setError(
        "Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.",
      );
    }
  }, []);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    scannerRef.current = null;
    setIsScanning(false);
    lastScannedRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return { isScanning, error, startScanning, stopScanning, scannerElementId };
}