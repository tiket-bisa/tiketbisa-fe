import { useAuth } from "~/core/auth";
import { ScanSection } from "~/modules/internal/ticket-scanning/presentation/components/scan-section";

export default function ScannerScanPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Scan Ticket</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Gunakan kamera atau unggah QR/barcode untuk melakukan check-in tiket.
        </p>
      </div>
      <ScanSection brandSlug={user?.brand_slug} />
    </div>
  );
}
