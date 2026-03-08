import { Navigate } from "react-router";

/** Partner — Brand Selection is not needed (partner is already scoped to their brand) */
export default function BrandSelectionPage() {
  return <Navigate to="/internal/partner" replace />;
}
