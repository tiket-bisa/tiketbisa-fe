import { Outlet, useNavigate } from "react-router";
import { AuthProvider, AuthGuard, useAuth } from "~/core/auth";
import { NavbarAdmin } from "~/shared/components";

function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/internal/admin/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-primary" data-theme="light">
      <NavbarAdmin
        userEmail={user?.email}
        onLogout={handleLogout}
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
