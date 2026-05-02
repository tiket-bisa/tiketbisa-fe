import { Navigate, useNavigate } from "react-router";
import { Button } from "~/core/design-system/components";
import { AuthProvider, useAuth } from "~/core/auth";

function InternalEntryContent() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-primary px-4" data-theme="light">
        <div className="text-text-secondary text-sm">Memuat...</div>
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to={user.role === "admin" ? "/internal-tb/admin" : "/internal-tb/partner"}
        replace
      />
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(107,33,168,0.18),_transparent_36%),linear-gradient(180deg,_#faf7ff_0%,_#f7f4ff_48%,_#ffffff_100%)] px-4 py-12" data-theme="light">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(107,33,168,0.08)_0%,transparent_45%,rgba(107,33,168,0.05)_100%)]" />
      <div className="relative w-full max-w-lg rounded-[2rem] border border-brand-primary/10 bg-white/95 p-8 shadow-[0_24px_80px_rgba(40,16,80,0.12)] backdrop-blur-sm sm:p-10">
        <div className="space-y-8 text-center">
          <div className="space-y-4">
            <img src="/logo/tiketbisa.png" alt="Tiketbisa" className="mx-auto h-14 w-auto" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-primary">Internal Access</p>
              <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Pilih jalur login internal</h1>
              <p className="text-sm leading-6 text-text-secondary">
                Masuk sebagai admin atau partner dari satu pintu internal. Setelah login, sistem akan membawa kamu ke dashboard yang sesuai dengan role.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button size="lg" className="w-full" onClick={() => navigate("/internal-tb/admin/login")}>
              Login Admin
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => navigate("/internal-tb/partner/login")}
            >
              Login Partner
            </Button>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface-secondary px-4 py-4 text-left text-sm text-text-secondary">
            <p className="font-medium text-text-primary">Catatan role</p>
            <p className="mt-1 leading-6">
              Akun admin akan masuk ke area admin, dan akun partner akan masuk ke area partner. Kalau email punya akses ke dua role, backend tetap akan menentukan role yang tepat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InternalEntryPage() {
  return (
    <AuthProvider>
      <InternalEntryContent />
    </AuthProvider>
  );
}
