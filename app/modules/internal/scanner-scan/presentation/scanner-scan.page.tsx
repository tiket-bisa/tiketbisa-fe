import { useAuth } from "~/core/auth";
import { ScanSection } from "~/modules/internal/ticket-scanning/presentation/components";

/** Scanner — single-purpose scan page (no tabs, no dashboard/generate-QR access) */
export default function ScannerScanPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-text-primary text-2xl font-bold">Scan Tiket</h1>
      <ScanSection brandSlug={user?.brand_slug} />
    </div>
  );
}
