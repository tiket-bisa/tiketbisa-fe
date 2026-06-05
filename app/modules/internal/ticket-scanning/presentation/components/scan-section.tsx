import { useState } from "react";
import { Card, Badge, Button } from "~/core/design-system/components";
import { useQrScanner } from "../hooks/use-qr-scanner";
import { useCheckIn } from "../hooks/use-checkin";
import type { TicketScanResult } from "~/core/types";

const SCAN_STATUS_MAP: Record<
  TicketScanResult["status"],
  { label: string; variant: "success" | "warning" | "destructive"; icon: string }
> = {
  valid: {
    label: "Valid - Check In Berhasil",
    variant: "success",
    icon: "check_circle",
  },
  already_checked_in: {
    label: "Sudah Check In",
    variant: "warning",
    icon: "warning",
  },
  invalid: {
    label: "Tiket Tidak Terdeteksi",
    variant: "destructive",
    icon: "cancel",
  },
  expired: {
    label: "Tiket Tidak Aktif / Kedaluwarsa",
    variant: "destructive",
    icon: "schedule",
  },
};

export function ScanSection() {
  const { scanResult, isLoading, handleScan, clearResult } = useCheckIn();
  const {
    cameras,
    error,
    isFileScanning,
    isScanning,
    isTorchOn,
    isTorchSupported,
    scanImageFile,
    selectedCameraId,
    startScanning,
    stopScanning,
    switchCamera,
    toggleTorch,
    scannerElementId,
  } = useQrScanner({ onScanSuccess: handleScan, disabled: isLoading });
  const [manualCode, setManualCode] = useState("");

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;
    handleScan(code);
    setManualCode("");
  };

  return (
    <div className="space-y-6">
      {/* Camera / Scanner View */}
      <Card padding="md">
        <div className="flex flex-col items-center gap-4">
          {cameras.length > 1 && (
            <div className="w-full max-w-md">
              <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="camera-select">
                Kamera
              </label>
              <select
                id="camera-select"
                value={selectedCameraId}
                onChange={(e) => switchCamera(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Kamera ${camera.id.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative w-full max-w-md aspect-[4/3] bg-surface-alt rounded-lg overflow-hidden">
            <div id={scannerElementId} className="w-full h-full" />
            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text-tertiary">
                <span className="material-symbols-outlined text-5xl mb-2">
                  photo_camera
                </span>
                <p className="text-sm">Kamera tidak aktif</p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-destructive-text text-sm">{error}</p>
          )}
          {isLoading && (
            <p className="text-text-secondary text-sm">Memproses scan...</p>
          )}

          <div className="flex gap-3">
            {!isScanning ? (
              <Button variant="primary" onClick={() => startScanning()} disabled={isLoading}>
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    videocam
                  </span>
                  Aktifkan Kamera
                </span>
              </Button>
            ) : (
              <Button variant="ghost" onClick={stopScanning} disabled={isLoading}>
                Matikan Kamera
              </Button>
            )}
            {isScanning && isTorchSupported && (
              <Button variant="secondary" onClick={toggleTorch} disabled={isLoading}>
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    flashlight_on
                  </span>
                  {isTorchOn ? "Matikan Flash" : "Nyalakan Flash"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Image Upload Fallback */}
      <Card padding="md">
        <h3 className="text-text-primary font-semibold mb-3">Upload Gambar QR/Barcode</h3>
        <p className="text-text-tertiary text-sm mb-3">
          Gunakan screenshot tiket jika kamera tidak bisa fokus atau perangkat tidak punya kamera.
        </p>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-button-secondary-border px-3 py-2 text-sm font-medium text-button-secondary-text hover:bg-surface-hover">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="sr-only"
            disabled={isLoading || isFileScanning}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) scanImageFile(file);
              e.target.value = "";
            }}
          />
          <span className="material-symbols-outlined mr-2 text-sm">upload</span>
          {isFileScanning ? "Memproses gambar..." : "Pilih Gambar"}
        </label>
      </Card>

      {/* Manual Code Input */}
      <Card padding="md">
        <h3 className="text-text-primary font-semibold mb-3">Input Manual</h3>
        <p className="text-text-tertiary text-sm mb-3">
          Masukkan kode tiket secara manual jika kamera tidak tersedia.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            placeholder="Masukkan kode tiket (contoh: TKB...)"
            disabled={isLoading}
            className="flex-1 rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <Button
            variant="primary"
            onClick={handleManualSubmit}
            disabled={!manualCode.trim() || isLoading}
          >
            {isLoading ? "Memproses..." : "Check In"}
          </Button>
        </div>
      </Card>

      {/* Scan Result */}
      {scanResult && (
        <Card padding="md">
          <div className="flex items-start gap-4">
            {(() => {
              const info = SCAN_STATUS_MAP[scanResult.status];
              return (
                <>
                  <span
                    className={`material-symbols-outlined text-3xl ${
                      scanResult.status === "valid"
                        ? "text-success-default"
                        : scanResult.status === "already_checked_in"
                          ? "text-warning-default"
                          : "text-destructive-default"
                    }`}
                  >
                    {info.icon}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={info.variant}>{info.label}</Badge>
                      <button
                        onClick={clearResult}
                        className="ml-auto text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                        aria-label="Tutup hasil scan"
                      >
                        <span className="material-symbols-outlined text-lg">
                          close
                        </span>
                      </button>
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <dt className="text-text-tertiary w-24 shrink-0">
                          ID Tiket:
                        </dt>
                        <dd className="text-text-primary font-mono">
                          {scanResult.ticket_id}
                        </dd>
                      </div>
                      {scanResult.event_name && (
                        <div className="flex gap-2">
                          <dt className="text-text-tertiary w-24 shrink-0">
                            Event:
                          </dt>
                          <dd className="text-text-primary">
                            {scanResult.event_name}
                          </dd>
                        </div>
                      )}
                      {scanResult.ticket_name && (
                        <div className="flex gap-2">
                          <dt className="text-text-tertiary w-24 shrink-0">
                            Tiket:
                          </dt>
                          <dd className="text-text-primary">
                            {scanResult.ticket_name}
                          </dd>
                        </div>
                      )}
                      {scanResult.buyer_name && (
                        <div className="flex gap-2">
                          <dt className="text-text-tertiary w-24 shrink-0">
                            Pembeli:
                          </dt>
                          <dd className="text-text-primary">
                            {scanResult.buyer_name}
                          </dd>
                        </div>
                      )}
                      {scanResult.checked_in_at && (
                        <div className="flex gap-2">
                          <dt className="text-text-tertiary w-24 shrink-0">
                            Check-in:
                          </dt>
                          <dd className="text-text-primary">
                            {new Date(scanResult.checked_in_at).toLocaleString(
                              "id-ID",
                            )}
                          </dd>
                        </div>
                      )}
                      {scanResult.message && (
                        <div className="flex gap-2">
                          <dt className="text-text-tertiary w-24 shrink-0">
                            Info:
                          </dt>
                          <dd className="text-text-primary">
                            {scanResult.message}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </>
              );
            })()}
          </div>
        </Card>
      )}
    </div>
  );
}
