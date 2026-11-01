import { Link } from "react-router";
import { Calendar, Clock, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type AppointmentStatus = "confirmado" | "pendente" | "concluido" | "cancelado";

interface Appointment {
  id: string;
  procedure: string;
  date: string;
  time: string;
  status: AppointmentStatus;
}

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: "1", procedure: "Limpeza de Pele Profunda", date: "2026-10-15", time: "10:00", status: "confirmado" },
  { id: "2", procedure: "Design de Sobrancelhas", date: "2026-10-08", time: "14:30", status: "pendente" },
  { id: "3", procedure: "Peeling Químico", date: "2026-09-20", time: "09:00", status: "concluido" },
  { id: "4", procedure: "Hidratação Facial", date: "2026-09-05", time: "11:00", status: "concluido" },
  { id: "5", procedure: "Micropigmentação de Lábios", date: "2026-08-14", time: "15:00", status: "cancelado" },
];

const statusConfig: Record<AppointmentStatus, { label: string; color: string; icon: React.ElementType }> = {
  confirmado: { label: "Confirmado", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle },
  pendente: { label: "Pendente", color: "text-amber-600 bg-amber-50", icon: AlertCircle },
  concluido: { label: "Concluído", color: "text-gray-500 bg-gray-100", icon: CheckCircle },
  cancelado: { label: "Cancelado", color: "text-red-500 bg-red-50", icon: XCircle },
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function ClienteAgendamentosPage() {
  const { user } = useAuth();

  const upcoming = MOCK_APPOINTMENTS.filter((a) => a.status === "confirmado" || a.status === "pendente");
  const past = MOCK_APPOINTMENTS.filter((a) => a.status === "concluido" || a.status === "cancelado");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Agendamentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{user?.phone}</p>
        </div>
        <Link
          to="/cliente/novo"
          className="flex items-center gap-2 px-4 py-2 bg-[#631a1d] text-white rounded-lg hover:bg-[#751e22] transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo
        </Link>
      </div>

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Próximos</h2>
          <div className="space-y-3">
            {upcoming.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Histórico</h2>
          <div className="space-y-3">
            {past.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const cfg = statusConfig[appointment.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="w-12 h-12 bg-[#fbe8e9] rounded-xl flex items-center justify-center flex-shrink-0">
        <Calendar className="w-6 h-6 text-[#631a1d]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{appointment.procedure}</p>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(appointment.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {appointment.time}
          </span>
        </div>
      </div>
      <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
        <StatusIcon className="w-3.5 h-3.5" />
        {cfg.label}
      </span>
    </div>
  );
}
