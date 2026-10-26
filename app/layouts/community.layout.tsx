import { Outlet, useNavigate } from "react-router";
import { AuthProvider, useAuth, AuthGuard } from "~/core/auth";
import { Button } from "~/core/design-system/components";
function CommunityShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen bg-surface-primary text-text-primary"
      data-theme="light"
    >
      <header className="border-b border-border-default">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
          <img
            src="/logo/tiketbisa.png"
            alt="Tiketbisa"
            className="h-8 w-auto"
          />
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-semibold">
              {user?.brand_name} · Komunitas
            </p>
            <p className="break-all text-xs text-text-secondary">
              {user?.username}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              navigate("/internal-tb");
            }}
          >
            Keluar
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
export default function CommunityLayout() {
  return (
    <AuthProvider>
      <AuthGuard requiredRole="community">
        <CommunityShell />
      </AuthGuard>
    </AuthProvider>
  );
}
