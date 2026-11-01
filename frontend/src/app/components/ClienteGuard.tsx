import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

export function ClienteGuard() {
  const { user } = useAuth();

  if (!user || user.role !== "client") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
