import { Link } from "react-router";
import { Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAppointments } from "../../context/AppointmentsContext";
import type { Appointment } from "../../config/types";

type AppointmentStatus = "confirmado" | "concluido" | "cancelado" | "ausente";

interface ClientAppointment {
  id: number;
  procedure: string;
  date: string;
  time: string;
  status: AppointmentStatus;
}

const statusConfig: Record<
  AppointmentStatus,
  {
    label: string;
    color: string;
    icon: React.ElementType;
  }
> = {
  confirmado: {
    label: "Confirmado",
    color: "text-emerald-600 bg-emerald-50",
    icon: CheckCircle,
  },
  ausente: {
    label: "Ausente",
    color: "text-orange-600 bg-orange-50",
    icon: AlertCircle,
  },
  concluido: {
    label: "Concluído",
    color: "text-gray-500 bg-gray-100",
    icon: CheckCircle,
  },
  cancelado: {
    label: "Cancelado",
    color: "text-red-500 bg-red-50",
    icon: XCircle,
  },
};

function toClientStatus(status: Appointment["status"]): AppointmentStatus {
  if (status === "Concluído") return "concluido";
  if (status === "Ausente") return "ausente";
  if (status === "Cancelado") return "cancelado";
  return "confirmado";
}

export function ClienteAgendamentosPage() {
  const { user } = useAuth();
  const { appointments, loading, error } = useAppointments();
  const clientAppointments: ClientAppointment[] = appointments.map((appointment) => ({
    id: appointment.id,
    procedure: appointment.procedure,
    date: appointment.date,
    time: appointment.time,
    status: toClientStatus(appointment.status),
  }));
  const upcoming = clientAppointments.filter((appointment) => appointment.status === "confirmado");
  const past = clientAppointments.filter(
    (appointment) =>
      appointment.status === "concluido" ||
      appointment.status === "cancelado" ||
      appointment.status === "ausente",
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Agendamentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.name}
            {user?.phone ? ` · ${user.phone}` : ""}
          </p>
        </div>
        <Link
          to="/cliente/novo"
          className="flex items-center gap-2 px-4 py-2 bg-brand-700 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Carregando agendamentos...</p>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Próximos
              </h2>
              <div className="space-y-3">
                {upcoming.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Histórico
              </h2>
              <div className="space-y-3">
                {past.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </section>
          )}

          {clientAppointments.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum agendamento encontrado.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: ClientAppointment }) {
  const cfg = statusConfig[appointment.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <Calendar className="w-6 h-6 text-brand-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{appointment.procedure}</p>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {appointment.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {appointment.time}
          </span>
        </div>
      </div>
      <span
        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}
      >
        <StatusIcon className="w-3.5 h-3.5" />
        {cfg.label}
      </span>
    </div>
  );
}
