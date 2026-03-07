import { Outlet, useNavigate } from "react-router";
import { AuthProvider, AuthGuard, useAuth } from "~/core/auth";
import { NavbarInternal } from "~/shared/components";

/**
 * Internal Layout — Partner Dashboard ([subdomain].tiketbisa.com)
 *
 * Structure: AuthProvider → AuthGuard → Header → <Outlet /> → Footer
 * Nav items: Beranda, Event, Analitik
 * Action: "Scan Tiket" button
 */

function InternalShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/internal/partner/login");
  };

  const handleScanTicket = () => {
    navigate("/internal/partner/scan");
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-primary" data-theme="light">
      <NavbarInternal
        userEmail={user?.email}
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

export default function InternalLayout() {
  return (
    <AuthProvider>
      <AuthGuard requiredRole="partner">
        <InternalShell />
      </AuthGuard>
    </AuthProvider>
  );
}
