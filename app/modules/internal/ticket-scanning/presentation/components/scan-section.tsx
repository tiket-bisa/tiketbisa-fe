import { useState } from "react";
import { Card, Badge, Button, Select } from "~/core/design-system/components";
import { useApiQuery } from "~/core/api";
import { useAuth } from "~/core/auth";
import { eventApi } from "~/core/api/services/event.api";
import { ticketCategoryApi } from "~/core/api/services/ticket-category.api";
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
    variant: "warning",
    icon: "schedule",
  },
};

export function ScanSection() {
  const { user } = useAuth();
  const { scanResult, isLoading, handleScan, clearResult } = useCheckIn();
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const isScannerReady = Boolean(selectedEventId && selectedCategoryId);

  const { data: events = [], loading: loadingEvents, error: eventError } = useApiQuery(
    async () => {
      const response = await eventApi.getList({
        limit: 100,
        offset: 0,
        ...(user?.role === "partner" && user.brand_id ? { brandId: user.brand_id } : {}),
      });

      return response.success && response.data ? response.data.events ?? [] : [];
    },
    [user?.role, user?.brand_id],
  );

  const { data: categories = [], loading: loadingCategories, error: categoryError } = useApiQuery(
    async () => {
      if (!selectedEventId) return [];
      const response = await ticketCategoryApi.getByEvent(selectedEventId);
      return response.success && response.data ? response.data : [];
    },
    [selectedEventId],
  );

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
  } = useQrScanner({
    onScanSuccess: (decodedText) => handleScan(decodedText, {
      eventId: selectedEventId,
      ticketCategoryId: selectedCategoryId,
    }),
    disabled: isLoading || !isScannerReady,
  });
  const [manualCode, setManualCode] = useState("");
  const backgroundClass = getScanBackgroundClass(scanResult?.status, error);
  const selectionError = eventError || categoryError;

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code || !isScannerReady) return;
    handleScan(code, {
      eventId: selectedEventId,
      ticketCategoryId: selectedCategoryId,
    });
    setManualCode("");
  };

  const handleEventChange = async (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedCategoryId("");
    clearResult();
    if (isScanning) {
      await stopScanning();
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    clearResult();
    if (isScanning) {
      await stopScanning();
    }
  };

  return (
    <div className={`space-y-6 rounded-2xl p-3 transition-colors duration-300 ${backgroundClass}`}>
      <Card padding="md">
        <div className="space-y-4">
          <div>
            <h3 className="text-text-primary font-semibold">Pilih Area Scan</h3>
            <p className="text-text-tertiary text-sm mt-1">
              Scanner hanya akan menerima tiket dari event dan kategori yang dipilih.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Event"
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              disabled={loadingEvents || isLoading}
              placeholder={loadingEvents ? "Memuat event..." : "Pilih event"}
              options={(events ?? []).map((event) => ({
                value: event.id,
                label: event.name,
              }))}
            />
            <Select
              label="Kategori tiket"
              value={selectedCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={!selectedEventId || loadingCategories || isLoading}
              placeholder={
                !selectedEventId
                  ? "Pilih event dulu"
                  : loadingCategories
                    ? "Memuat kategori..."
                    : "Pilih kategori"
              }
              options={(categories ?? []).map((category) => ({
                value: category.id,
                label: category.name,
              }))}
            />
          </div>
          {selectionError && (
            <p className="text-destructive-text text-sm">{selectionError}</p>
          )}
          {!isScannerReady && (
            <p className="text-warning-text text-sm">
              Pilih event dan kategori tiket sebelum mengaktifkan kamera, upload gambar, atau input manual.
            </p>
          )}
        </div>
      </Card>

      {/* Scan Result */}
      {scanResult && (
        <ScanResultCard scanResult={scanResult} clearResult={clearResult} />
      )}

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
              <Button variant="primary" onClick={() => startScanning()} disabled={isLoading || !isScannerReady}>
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
            disabled={isLoading || isFileScanning || !isScannerReady}
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
            disabled={isLoading || !isScannerReady}
            className="flex-1 rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <Button
            variant="primary"
            onClick={handleManualSubmit}
            disabled={!manualCode.trim() || isLoading || !isScannerReady}
          >
            {isLoading ? "Memproses..." : "Check In"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ScanResultCard({
  scanResult,
  clearResult,
}: {
  scanResult: TicketScanResult;
  clearResult: () => void;
}) {
  const info = SCAN_STATUS_MAP[scanResult.status];
  return (
    <Card padding="md">
      <div className="flex items-start gap-4">
        <span
          className={`material-symbols-outlined text-3xl ${
            scanResult.status === "valid"
              ? "text-success-default"
              : scanResult.status === "already_checked_in" || scanResult.status === "expired"
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
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <dl className="space-y-2 text-sm">
            <ScanDetail label="ID Tiket" value={scanResult.ticket_id} mono />
            {scanResult.event_name && <ScanDetail label="Event" value={scanResult.event_name} />}
            {scanResult.ticket_name && <ScanDetail label="Kategori" value={scanResult.ticket_name} />}
            {scanResult.buyer_name && <ScanDetail label="Pembeli" value={scanResult.buyer_name} />}
            {scanResult.checked_in_at && (
              <ScanDetail label="Check-in" value={new Date(scanResult.checked_in_at).toLocaleString("id-ID")} />
            )}
            {scanResult.message && <ScanDetail label="Info" value={scanResult.message} />}
          </dl>
        </div>
      </div>
    </Card>
  );
}

function ScanDetail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="text-text-tertiary w-24 shrink-0">{label}:</dt>
      <dd className={`text-text-primary ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function getScanBackgroundClass(status?: TicketScanResult["status"], scannerError?: string | null): string {
  if (status === "valid") return "bg-green-50";
  if (status === "already_checked_in" || status === "expired") return "bg-amber-50";
  if (status === "invalid" || scannerError) return "bg-red-50";
  return "bg-transparent";
}
