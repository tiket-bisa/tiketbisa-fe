import { Outlet, useNavigate } from "react-router";
import { AuthProvider, useAuth } from "~/core/auth/auth.context";
import { AuthGuard } from "~/core/auth/auth-guard";
import { RealtimeProvider } from "~/core/realtime";
import { RouteProgress } from "~/shared/components/route-progress";
import { ScannerNavbar } from "~/shared/components/scanner-navbar/scanner-navbar";

function ScannerShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/internal-tb");
  };

  const handleScanTicket = () => {
    navigate("/internal-tb/scanner/scan");
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-primary text-text-primary" data-theme="light">
      <RouteProgress />
      <ScannerNavbar
        identifier={user?.identifier}
        brandName={user?.brand_name}
        onLogout={handleLogout}
        onScanTicket={handleScanTicket}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-border-subtle py-6 text-center text-xs text-text-tertiary">
        &copy; {new Date().getFullYear()} Tiketbisa. All rights reserved.
      </footer>
    </div>
  );
}

export default function ScannerLayout() {
  return (
    <AuthProvider>
      <AuthGuard requiredRole="scanner">
        <RealtimeProvider>
          <ScannerShell />
        </RealtimeProvider>
      </AuthGuard>
    </AuthProvider>
  );
}
