import { Outlet, useNavigate } from "react-router";
import { AuthProvider, useAuth } from "~/core/auth/auth.context";
import { AuthGuard } from "~/core/auth/auth-guard";
import { RealtimeProvider, useRealtime } from "~/core/realtime";
import { NavbarAdmin } from "~/shared/components";
import { RouteProgress } from "~/shared/components/route-progress";

function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/internal-tb");
  };

  const handleScanTicket = () => {
    navigate("/internal-tb/admin/scan");
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-primary text-text-primary" data-theme="light">
      <RouteProgress />
      <NavbarAdmin
        userEmail={user?.email}
        onLogout={handleLogout}
        onScanTicket={handleScanTicket}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <RealtimeStatus />
        <Outlet />
      </main>
      <footer className="border-t border-border-subtle py-6 text-center text-xs text-text-tertiary">
        &copy; {new Date().getFullYear()} Tiketbisa. All rights reserved.
      </footer>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AuthProvider>
      <AuthGuard requiredRole="admin">
        <RealtimeProvider>
          <AdminShell />
        </RealtimeProvider>
      </AuthGuard>
    </AuthProvider>
  );
}

function RealtimeStatus() {
  const realtime = useRealtime();
  if (!realtime || realtime.status === "connected" || realtime.status === "idle") {
    return null;
  }

  const label = realtime.status === "reconnecting" ? "Realtime reconnecting" : "Realtime offline";
  return (
    <div className="mb-4 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs font-medium text-warning-text">
      {label}. Data REST tetap bisa digunakan.
    </div>
  );
}
