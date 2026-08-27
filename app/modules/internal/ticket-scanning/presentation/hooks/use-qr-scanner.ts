import { useState, useRef, useCallback, useEffect } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type CameraDevice,
} from "html5-qrcode";

interface UseQrScannerOptions {
  onScanSuccess: (decodedText: string) => void;
  disabled?: boolean;
}

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
];

function createScanner(elementId: string) {
  return new Html5Qrcode(elementId, {
    verbose: false,
    formatsToSupport: SUPPORTED_FORMATS,
  });
}

export function useQrScanner({ onScanSuccess, disabled = false }: UseQrScannerOptions) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isFileScanning, setIsFileScanning] = useState(false);
  const lastScannedRef = useRef<string | null>(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  const disabledRef = useRef(disabled);
  const scanningRequestedRef = useRef(false);
  onScanSuccessRef.current = onScanSuccess;
  disabledRef.current = disabled;

  const scannerElementId = "qr-scanner-region";

  const loadCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      setSelectedCameraId((current) => current || devices.find((camera) =>
        /back|rear|environment/i.test(camera.label),
      )?.id || devices[0]?.id || "");
      return devices;
    } catch {
      setCameras([]);
      setError("Tidak menemukan kamera. Gunakan input manual atau upload gambar tiket.");
      return [];
    }
  }, []);

  const stopScanning = useCallback(async () => {
    scanningRequestedRef.current = false;
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    scannerRef.current = null;
    setIsScanning(false);
    setIsTorchSupported(false);
    setIsTorchOn(false);
    lastScannedRef.current = null;
  }, []);

  const startScanning = useCallback(async (cameraId?: string) => {
    scanningRequestedRef.current = true;
    try {
      setError(null);
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }

      const scanner = createScanner(scannerElementId);
      scannerRef.current = scanner;
      const selectedId = cameraId || selectedCameraId;
      const cameraConfig = selectedId ? selectedId : { facingMode: "environment" };

      await scanner.start(
        cameraConfig,
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
          // No QR/barcode found in frame - normal, ignore
        },
      );

      setIsScanning(true);
      setSelectedCameraId(selectedId || "");
      try {
        const torch = scanner.getRunningTrackCameraCapabilities().torchFeature();
        setIsTorchSupported(torch.isSupported());
      } catch {
        setIsTorchSupported(false);
      }
    } catch (err) {
      setError(getCameraErrorMessage(err));
      setIsScanning(false);
      setIsTorchSupported(false);
    }
  }, [selectedCameraId]);

  const ensureScanning = useCallback(async () => {
    if (!scanningRequestedRef.current) return;
    if (scannerRef.current?.isScanning) {
      setIsScanning(true);
      return;
    }
    await startScanning();
  }, [startScanning]);

  const switchCamera = useCallback(async (cameraId: string) => {
    setSelectedCameraId(cameraId);
    if (isScanning) {
      await startScanning(cameraId);
    }
  }, [isScanning, startScanning]);

  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current?.isScanning || !isTorchSupported) return;
    const next = !isTorchOn;
    try {
      await scannerRef.current.getRunningTrackCameraCapabilities().torchFeature().apply(next);
      setIsTorchOn(next);
    } catch {
      setError("Flash kamera tidak bisa diaktifkan di perangkat ini.");
    }
  }, [isTorchOn, isTorchSupported]);

  const scanImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar QR/barcode.");
      return;
    }
    setError(null);
    setIsFileScanning(true);
    try {
      const scanner = createScanner(scannerElementId);
      const result = await scanner.scanFileV2(file, false);
      onScanSuccessRef.current(result.decodedText);
      scanner.clear();
    } catch {
      setError("QR/barcode tidak terdeteksi dari gambar. Pastikan gambar jelas dan tidak blur.");
    } finally {
      setIsFileScanning(false);
    }
  }, []);

  useEffect(() => {
    loadCameras();
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [loadCameras]);

  return {
    cameras,
    error,
    isFileScanning,
    isScanning,
    isTorchOn,
    isTorchSupported,
    ensureScanning,
    loadCameras,
    scanImageFile,
    scannerElementId,
    selectedCameraId,
    startScanning,
    stopScanning,
    switchCamera,
    toggleTorch,
  };
}

function getCameraErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("permission") || message.includes("denied") || message.includes("notallowed")) {
    return "Izin kamera ditolak. Berikan izin kamera di browser, atau gunakan input manual/upload gambar.";
  }
  if (message.includes("notfound") || message.includes("requested device not found")) {
    return "Kamera tidak ditemukan. Gunakan input manual atau upload gambar tiket.";
  }
  if (message.includes("notreadable") || message.includes("track start failed")) {
    return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi kamera lain lalu coba lagi.";
  }
  if (typeof window !== "undefined" && window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
    return "Kamera hanya tersedia di HTTPS. Buka dashboard melalui HTTPS.";
  }
  return "Tidak dapat mengakses kamera. Gunakan input manual atau upload gambar tiket.";
}
