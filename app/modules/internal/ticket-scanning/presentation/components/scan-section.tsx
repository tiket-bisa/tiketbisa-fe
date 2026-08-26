import { useEffect, useState } from "react";
import { Card, Badge, Button } from "~/core/design-system/components";
import { useQrScanner } from "../hooks/use-qr-scanner";
import { useScanFlow } from "../hooks/use-scan-flow";
import type { ScanCheckInResult, ScanValidateResult } from "~/core/types";
import { CategoryPicker, type SelectedCategory } from "./category-picker";
import { persistScanSelection, readScanSelection } from "../scan-selection-storage";

const VALIDATE_STATUS_MAP: Record<
  ScanValidateResult["status"],
  { label: string; variant: "success" | "warning" | "destructive"; icon: string }
> = {
  VALID: { label: "VALID", variant: "success", icon: "check_circle" },
  ALREADY_CHECKED_IN: { label: "ALREADY CHECKED-IN", variant: "warning", icon: "warning" },
  INVALID: { label: "INVALID", variant: "destructive", icon: "cancel" },
  WRONG_CATEGORY: { label: "WRONG CATEGORY", variant: "warning", icon: "sync_problem" },
};

const CHECKIN_STATUS_MAP: Record<
  ScanCheckInResult["status"],
  { label: string; variant: "success" | "destructive"; icon: string }
> = {
  SUCCESS: { label: "SUCCESS CHECKED-IN", variant: "success", icon: "check_circle" },
  FAILED: { label: "FAILED CHECKED-IN", variant: "destructive", icon: "cancel" },
};

interface ScanSectionProps {
  /** Restrict the category picker to a single brand (partner/scanner). Omit for admin. */
  brandId?: string;
}

export function ScanSection({ brandId }: ScanSectionProps) {
  const [category, setCategory] = useState<SelectedCategory | null>(null);
  const [selectionRestored, setSelectionRestored] = useState(false);
  const {
    validateResult,
    checkInResult,
    isValidating,
    isCheckingIn,
    isBusy,
    handleScan,
    confirmCheckIn,
    clearResult,
  } = useScanFlow(category?.eventId, category?.categoryId);

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
  } = useQrScanner({ onScanSuccess: handleScan, disabled: isBusy });
  const [manualCode, setManualCode] = useState("");
  const backgroundClass = getScanBackgroundClass(validateResult, checkInResult, error);

  useEffect(() => {
    setCategory(readScanSelection(brandId, window.sessionStorage));
    setSelectionRestored(true);
  }, [brandId]);

  useEffect(() => {
    if (!selectionRestored) return;
    persistScanSelection(
      category,
      brandId,
      window.sessionStorage,
    );
  }, [brandId, category, selectionRestored]);

  // Freeze the scanner after the first result so the same camera frame cannot immediately replace
  // VALID/SUCCESS with another scan. The operator explicitly closes the result before continuing.
  useEffect(() => {
    if (validateResult && isScanning) {
      void stopScanning();
    }
  }, [isScanning, stopScanning, validateResult]);

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;
    handleScan(code);
    setManualCode("");
  };

  return (
    <div className={`space-y-6 rounded-2xl p-3 transition-colors duration-300 ${backgroundClass}`}>
      {/* Category scope gate */}
      <CategoryPicker brandId={brandId} selected={category} onChange={setCategory} />

      {!category && (
        <Card padding="md">
          <p className="text-text-tertiary text-sm text-center">
            Pilih event &amp; kategori tiket di atas terlebih dahulu untuk mulai scan.
          </p>
        </Card>
      )}

      {category && (
        <>
          {/* Scan Result */}
          {validateResult && (
            <ScanResultCard
              validateResult={validateResult}
              checkInResult={checkInResult}
              isCheckingIn={isCheckingIn}
              onCheckIn={confirmCheckIn}
              clearResult={clearResult}
            />
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
                    disabled={isBusy}
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
              {isValidating && (
                <p className="text-text-secondary text-sm">Memvalidasi tiket...</p>
              )}

              <div className="flex gap-3">
                {!isScanning ? (
                  <Button variant="primary" onClick={() => startScanning()} disabled={isBusy}>
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">
                        videocam
                      </span>
                      Aktifkan Kamera
                    </span>
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={stopScanning} disabled={isBusy}>
                    Matikan Kamera
                  </Button>
                )}
                {isScanning && isTorchSupported && (
                  <Button variant="secondary" onClick={toggleTorch} disabled={isBusy}>
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
                disabled={isBusy || isFileScanning}
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
                disabled={isBusy}
                className="flex-1 rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <Button
                variant="primary"
                onClick={handleManualSubmit}
                disabled={!manualCode.trim() || isBusy}
              >
                {isValidating ? "Memvalidasi..." : "Validasi"}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function ScanResultCard({
  validateResult,
  checkInResult,
  isCheckingIn,
  onCheckIn,
  clearResult,
}: {
  validateResult: ScanValidateResult;
  checkInResult: ScanCheckInResult | null;
  isCheckingIn: boolean;
  onCheckIn: () => void;
  clearResult: () => void;
}) {
  const info = VALIDATE_STATUS_MAP[validateResult.status];
  const checkInInfo = checkInResult ? CHECKIN_STATUS_MAP[checkInResult.status] : null;
  const isPartnerSourced = validateResult.source === "PARTNER";

  return (
    <Card padding="md">
      <div className="flex items-start gap-4">
        <span
          className={`material-symbols-outlined text-3xl ${
            info.variant === "success"
              ? "text-success-default"
              : info.variant === "warning"
                ? "text-warning-default"
                : "text-destructive-default"
          }`}
        >
          {info.icon}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={info.variant}>{info.label}</Badge>
            {checkInInfo && <Badge variant={checkInInfo.variant}>{checkInInfo.label}</Badge>}
            <button
              onClick={clearResult}
              className="ml-auto text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Tutup hasil scan"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <dl className="space-y-2 text-sm">
            {validateResult.holderName && (
              <ScanDetail label="Pemegang" value={validateResult.holderName} />
            )}
            {isPartnerSourced && validateResult.partner && (
              <ScanDetail label="Partner" value={validateResult.partner} />
            )}
            {validateResult.ticketCategoryName && (
              <ScanDetail label="Kategori" value={validateResult.ticketCategoryName} />
            )}
            {validateResult.checkInTime && (
              <ScanDetail
                label="Check-in"
                value={new Date(validateResult.checkInTime).toLocaleString("id-ID")}
              />
            )}
            {validateResult.message && <ScanDetail label="Info" value={validateResult.message} />}
            {checkInResult?.status === "SUCCESS" && (
              <ScanDetail label="Status" value="Tiket berhasil check-in" />
            )}
            {checkInResult?.checkInTime && (
              <ScanDetail
                label="Waktu"
                value={new Date(checkInResult.checkInTime).toLocaleString("id-ID")}
              />
            )}
            {checkInResult?.message && <ScanDetail label="Hasil" value={checkInResult.message} />}
          </dl>

          {validateResult.status === "VALID" && !checkInResult && (
            <div className="mt-4">
              <Button variant="primary" onClick={onCheckIn} disabled={isCheckingIn} fullWidth>
                {isCheckingIn ? "Memproses Check In..." : "CHECK IN"}
              </Button>
            </div>
          )}
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

function getScanBackgroundClass(
  validateResult: ScanValidateResult | null,
  checkInResult: ScanCheckInResult | null,
  scannerError?: string | null,
): string {
  if (checkInResult?.status === "SUCCESS") return "bg-green-50";
  if (checkInResult?.status === "FAILED") return "bg-red-50";
  if (validateResult?.status === "VALID") return "bg-green-50";
  if (validateResult?.status === "ALREADY_CHECKED_IN" || validateResult?.status === "WRONG_CATEGORY") return "bg-amber-50";
  if (validateResult?.status === "INVALID" || scannerError) return "bg-red-50";
  return "bg-transparent";
}
