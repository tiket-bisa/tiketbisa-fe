import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, Card } from "~/core/design-system/components";
import type { TicketScanResult } from "~/core/types";

const SCAN_STATUS_MAP = {
  valid: { label: "Valid - Check In Berhasil", variant: "success" as const, icon: "check_circle" },
  already_checked_in: { label: "Sudah Check In", variant: "warning" as const, icon: "warning" },
  invalid: { label: "Tiket Tidak Valid", variant: "destructive" as const, icon: "cancel" },
  expired: { label: "Tiket Kedaluwarsa", variant: "destructive" as const, icon: "schedule" },
};

/** Camera-based ticket scanner */
export function ScanSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<TicketScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const simulateScan = () => {
    // TODO: Replace with real QR/barcode scanning logic
    const mockResults: TicketScanResult[] = [
      {
        ticket_id: "TKT-001",
        event_name: "Adhyaksa FC vs Persija Jakarta",
        ticket_name: "Tribune Utara",
        buyer_name: "Budi Santoso",
        status: "valid",
      },
      {
        ticket_id: "TKT-002",
        event_name: "Adhyaksa FC vs Persija Jakarta",
        ticket_name: "VIP",
        buyer_name: "Siti Rahayu",
        status: "already_checked_in",
        checked_in_at: "2026-03-15T18:30:00Z",
      },
      {
        ticket_id: "TKT-003",
        event_name: "Adhyaksa FC vs Persib Bandung",
        ticket_name: "Tribune Selatan",
        buyer_name: "Unknown",
        status: "invalid",
      },
    ];
    const random = mockResults[Math.floor(Math.random() * mockResults.length)];
    setScanResult(random);
  };

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-full max-w-md aspect-[4/3] bg-surface-alt rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? "" : "hidden"}`}
            />
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text-tertiary">
                <span className="material-symbols-outlined text-5xl mb-2">
                  photo_camera
                </span>
                <p className="text-sm">Kamera tidak aktif</p>
              </div>
            )}
            {cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-brand-primary rounded-xl opacity-70" />
              </div>
            )}
          </div>

          {error && (
            <p className="text-destructive-text text-sm">{error}</p>
          )}

          <div className="flex gap-3">
            {!cameraActive ? (
              <Button variant="primary" onClick={startCamera}>
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">videocam</span>
                  Aktifkan Kamera
                </span>
              </Button>
            ) : (
              <>
                <Button variant="primary" onClick={simulateScan}>
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                    Scan
                  </span>
                </Button>
                <Button variant="ghost" onClick={stopCamera}>
                  Matikan Kamera
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

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
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <dt className="text-text-tertiary w-24 shrink-0">ID Tiket:</dt>
                        <dd className="text-text-primary font-mono">{scanResult.ticket_id}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-text-tertiary w-24 shrink-0">Event:</dt>
                        <dd className="text-text-primary">{scanResult.event_name}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-text-tertiary w-24 shrink-0">Tiket:</dt>
                        <dd className="text-text-primary">{scanResult.ticket_name}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-text-tertiary w-24 shrink-0">Pembeli:</dt>
                        <dd className="text-text-primary">{scanResult.buyer_name}</dd>
                      </div>
                      {scanResult.checked_in_at && (
                        <div className="flex gap-2">
                          <dt className="text-text-tertiary w-24 shrink-0">Check-in:</dt>
                          <dd className="text-text-primary">
                            {new Date(scanResult.checked_in_at).toLocaleString("id-ID")}
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
