import { Navigate } from "react-router";
import { useAuth } from "./auth.context";

/**
 * Guard that redirects unauthenticated users to /partner/login.
 * Wrap protected routes/layouts with this component.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-primary">
        <div className="text-text-secondary text-sm">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/partner/login" replace />;
  }

  return <>{children}</>;
}
