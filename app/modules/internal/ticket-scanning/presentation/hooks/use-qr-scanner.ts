import { useState, useRef, useCallback, useEffect } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface UseQrScannerOptions {
  onScanSuccess: (decodedText: string) => void;
  disabled?: boolean;
}

export function useQrScanner({ onScanSuccess, disabled = false }: UseQrScannerOptions) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  const disabledRef = useRef(disabled);
  onScanSuccessRef.current = onScanSuccess;
  disabledRef.current = disabled;

  const scannerElementId = "qr-scanner-region";

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      const scanner = new Html5Qrcode(scannerElementId, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
        ],
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          aspectRatio: 4 / 3,
        },
        (decodedText) => {
          if (disabledRef.current) return;
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
