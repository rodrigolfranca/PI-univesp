import { Navigate } from "react-router";
import { AvailabilitySettings } from "../components/AvailabilitySettings";
import { useAuth } from "../context/AuthContext";

export function AvailabilityPage() {
  const { user } = useAuth();
  if (!user?.isAdmin) {
    return <Navigate to="/app/appointments" replace />;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Disponibilidade</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Gerencie horários de trabalho e exceções de agenda.
        </p>
      </div>
      <AvailabilitySettings />
    </div>
  );
}
