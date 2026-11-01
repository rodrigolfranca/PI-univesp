import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

export function EmployeeGuard() {
  const { user } = useAuth();

  if (!user || user.role !== "employee") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
