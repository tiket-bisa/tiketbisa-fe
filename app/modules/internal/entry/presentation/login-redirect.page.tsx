import { Navigate } from "react-router";

export default function LoginRedirectPage() {
  return <Navigate to="/internal-tb" replace />;
}