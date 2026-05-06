import { useState } from "react";
import { Navigate } from "react-router";
import { Button } from "~/core/design-system/components";
import { AuthProvider, useAuth } from "~/core/auth";
import { requestGoogleAuthorizationCode } from "~/core/auth/google-oauth.client";
import { requestInternalGoogleToken } from "~/core/auth/internal-auth.api";

function InternalEntryContent() {
  const { user, isLoading, loginWithOAuth } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-primary px-4" data-theme="light">
        <div className="text-text-secondary text-sm">Memuat...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === "admin" ? "/internal-tb/admin" : "/internal-tb/partner"} replace />;
  }

  const handleLogin = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const authCode = await requestGoogleAuthorizationCode();
      const tokenData = await requestInternalGoogleToken(authCode);

      loginWithOAuth(tokenData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal login dengan Google");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(107,33,168,0.18),_transparent_36%),linear-gradient(180deg,_#faf7ff_0%,_#f7f4ff_48%,_#ffffff_100%)] px-4 py-12"
      data-theme="light"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(107,33,168,0.08)_0%,transparent_45%,rgba(107,33,168,0.05)_100%)]" />
      <div className="relative w-full max-w-lg rounded-[2rem] border border-brand-primary/10 bg-white/95 p-8 shadow-[0_24px_80px_rgba(40,16,80,0.12)] backdrop-blur-sm sm:p-10">
        <div className="space-y-8 text-center">
          <div className="space-y-4">
            <img src="/logo/tiketbisa.png" alt="Tiketbisa" className="mx-auto h-14 w-auto" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-primary">Internal</p>
              <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Masuk ke dashboard internal</h1>
              <p className="text-sm leading-6 text-text-secondary">
                Gunakan akun Google yang terdaftar. Sistem akan mengarahkan kamu ke dashboard yang sesuai secara otomatis.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleLogin}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-3"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {isSubmitting ? "Memproses..." : "Sign in with Google"}
            </Button>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Internal login page (Standalone, no layout) */
export default function InternalEntryPage() {
  return (
    <AuthProvider>
      <InternalEntryContent />
    </AuthProvider>
  );
}
