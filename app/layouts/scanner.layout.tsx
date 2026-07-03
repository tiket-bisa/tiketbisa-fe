import { Outlet, useNavigate } from "react-router";
import { AuthProvider, useAuth } from "~/core/auth/auth.context";
import { AuthGuard } from "~/core/auth/auth-guard";
import { RealtimeProvider } from "~/core/realtime";
import { NavbarAdmin } from "~/shared/components";
import { RouteProgress } from "~/shared/components/route-progress";

/**
 * Scanner Layout — locked-down shell for the "scanner" role (/internal-tb/scanner)
 *
 * Structure: AuthProvider → AuthGuard(requiredRole="scanner") → Header (stripped nav) → <Outlet /> → Footer
 * No Brand/Event/Analitik nav links — scanners only see a "Scan Tiket" action.
 */

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
      <NavbarAdmin
        variant="scanner"
        userEmail={user?.email}
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
