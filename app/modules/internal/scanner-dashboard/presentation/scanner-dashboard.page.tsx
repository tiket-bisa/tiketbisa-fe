import { useNavigate } from "react-router";
import { Button, Card } from "~/core/design-system/components";
import { useAuth } from "~/core/auth";

/** Scanner — minimal beranda with only a prominent "Scan Ticket" action */
export default function ScannerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-primary">
          Selamat datang
        </p>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
          {user?.brand_name ? user.brand_name : "Petugas Scan Tiketbisa"}
        </h1>
        <p className="text-sm text-text-secondary">
          {user?.email ? `Masuk sebagai ${user.email}` : "Siap untuk memeriksa tiket masuk."}
        </p>
      </div>

      <Card padding="lg" className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-brand-primary">
            qr_code_scanner
          </span>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate("/internal-tb/scanner/scan")}
          >
            SCAN TICKET
          </Button>
        </div>
      </Card>
    </div>
  );
}
