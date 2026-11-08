import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../context/AuthContext";

export function AgendarPage() {
  const { user, loading } = useAuth();
  const { treatmentId } = useParams<{ treatmentId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    const query = new URLSearchParams();
    if (treatmentId) query.set("treatmentId", treatmentId);
    const suffix = query.toString() ? `?${query.toString()}` : "";

    if (!user) {
      navigate(`/login${suffix}`, { replace: true });
    } else if (user.role === "client") {
      navigate(`/cliente/novo${suffix}`, { replace: true });
    } else {
      navigate("/app/appointments", { replace: true });
    }
  }, [loading, navigate, treatmentId, user]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
      <p className="text-sm text-gray-600">Redirecionando para o agendamento...</p>
    </main>
  );
}
