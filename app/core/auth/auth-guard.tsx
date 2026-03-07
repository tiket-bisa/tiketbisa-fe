import { Navigate } from "react-router";
import { useAuth, type AuthRole } from "./auth.context";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: AuthRole;
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-primary">
        <div className="text-text-secondary text-sm">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    const loginPath = requiredRole === "admin" ? "/admin/login" : "/partner/login";
    return <Navigate to={loginPath} replace />;
  }

  // Role mismatch: redirect to the correct dashboard
  if (requiredRole && user.role !== requiredRole) {
    const redirectPath = user.role === "admin" ? "/admin" : "/partner";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
