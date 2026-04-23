import { Outlet, useNavigate } from "react-router";
import { AuthProvider, useAuth } from "~/core/auth/auth.context";
import { AuthGuard } from "~/core/auth/auth-guard";
import { NavbarAdmin } from "~/shared/components";

function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/internal/admin/login");
  };

  const handleScanTicket = () => {
    navigate("/internal/admin/scan");
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-primary" data-theme="light">
      <NavbarAdmin
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

export default function AdminLayout() {
  return (
    <AuthProvider>
      <AuthGuard requiredRole="admin">
        <AdminShell />
      </AuthGuard>
    </AuthProvider>
  );
}
