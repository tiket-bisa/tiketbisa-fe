import { useNavigate } from "react-router";
import { useAuth } from "~/core/auth";
import { Button, Card } from "~/core/design-system/components";

export default function ScannerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Beranda Scanner</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Akun ini hanya bisa dipakai untuk scan dan check-in tiket event pada brand yang ditugaskan.
        </p>
      </div>

      <Card padding="md">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-tertiary">Brand</p>
            <p className="mt-2 text-lg font-semibold text-text-primary">{user?.brand_name ?? "-"}</p>
            <p className="mt-1 text-sm text-text-secondary">{user?.identifier ?? "-"}</p>
          </div>
          <Button variant="primary" size="lg" onClick={() => navigate("/internal-tb/scanner/scan")}>
            Scan Ticket
          </Button>
        </div>
      </Card>
    </div>
  );
}
