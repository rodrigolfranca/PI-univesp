import { useEffect, useState } from "react";
import { Calendar, Clock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";
import { listSchedules } from "../services/schedules";
import type { ApiSchedule } from "../services/schedules";
import { STATUS_STYLE } from "../utils/appointments/constants";
import { displayStatusFromApi, isoToDisplayDate } from "../utils/appointments/appointment";
import { sortSchedulesNewestFirst } from "../utils/appointments/history";

export function ClientHistory({ clientId }: { clientId: number }) {
  const { token } = useAuth();
  const [schedules, setSchedules] = useState<ApiSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setSchedules([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    listSchedules(token, { client_id: clientId }, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setSchedules(sortSchedulesNewestFirst(result));
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [clientId, token]);

  return (
    <section className="space-y-4 rounded-xl border bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold">Histórico de atendimentos</h2>
        <p className="text-sm text-gray-500">
          Agendamentos do cliente, do mais recente para o mais antigo.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando histórico...</p>
      ) : schedules.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum atendimento registrado.</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {schedules.map((schedule) => {
            const status = displayStatusFromApi(schedule.status);
            return (
              <div
                key={schedule.id}
                className="flex flex-wrap items-center gap-3 p-3 text-sm md:flex-nowrap"
              >
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {isoToDisplayDate(schedule.date)}
                  </span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {schedule.start_time}
                  </span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <User className="h-4 w-4 text-gray-400" />
                    {schedule.professional?.name ?? "Profissional"}
                  </span>
                  <span className="min-w-0 truncate text-gray-900">
                    {schedule.procedure?.name ?? "Procedimento"}
                  </span>
                  <span className="text-xs text-gray-400">#{schedule.id}</span>
                </div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[status].badge}`}
                >
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
