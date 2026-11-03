import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../context/AuthContext";
import { RequestState } from "./RequestState";

export function AuthGuard({ role }: { role: UserRole }) {
  const { user, loading, error, retrySession } = useAuth();
  if (loading || error)
    return <RequestState loading={loading} error={error} onRetry={retrySession} />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role)
    return <Navigate to={user.role === "employee" ? "/app" : "/cliente/perfil"} replace />;
  return <Outlet />;
}
