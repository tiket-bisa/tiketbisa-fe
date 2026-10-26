import { Navigate } from "react-router";
import { useAuth, type AuthRole } from "./auth.context";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: AuthRole;
}

function getRoleHomePath(role: AuthRole): string {
  if (role === "admin") return "/internal-tb/admin";
  if (role === "partner") return "/internal-tb/partner";
  return "/internal-tb/scanner";
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
    const loginPath = "/internal-tb";
    return <Navigate to={loginPath} replace />;
  }

  // Role mismatch: redirect to the correct dashboard
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return <>{children}</>;
}
