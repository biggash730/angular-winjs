import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdminRole, useAuthStore } from "@/store/auth";

export function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated || !user || !isAdminRole(user.role)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
