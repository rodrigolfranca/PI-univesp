import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UsersContext";
import { errorMessage } from "../services/api";
import {
  createScheduleException,
  createWorkSchedule,
  deleteScheduleException,
  deleteWorkSchedule,
  listScheduleExceptions,
  listWorkSchedules,
} from "../services/schedules";
import type {
  ApiScheduleException,
  ApiWorkSchedule,
  ScheduleExceptionType,
} from "../services/schedules";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AvailabilitySettings() {
  const { user, token } = useAuth();
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const professionals = users.filter((entry) => entry.professional);
  const [professionalId, setProfessionalId] = useState(
    user?.professionalId ? String(user.professionalId) : "",
  );
  const [schedules, setSchedules] = useState<ApiWorkSchedule[]>([]);
  const [exceptions, setExceptions] = useState<ApiScheduleException[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [days, setDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [saving, setSaving] = useState(false);
  const [exceptionDate, setExceptionDate] = useState(new Date().toISOString().slice(0, 10));
  const [exceptionType, setExceptionType] = useState<ScheduleExceptionType>("blocked");
  const [exceptionStart, setExceptionStart] = useState("");
  const [exceptionEnd, setExceptionEnd] = useState("");
  const [savingException, setSavingException] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!professionalId && professionals[0]) {
      setProfessionalId(String(professionals[0].professional!.id));
    }
  }, [professionalId, professionals]);

  useEffect(() => {
    if (!token || !professionalId) {
      setSchedules([]);
      setExceptions([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      listWorkSchedules(token, Number(professionalId), controller.signal),
      listScheduleExceptions(token, Number(professionalId), controller.signal),
    ])
      .then(([workSchedules, scheduleExceptions]) => {
        if (!controller.signal.aborted) {
          setSchedules(workSchedules);
          setExceptions(scheduleExceptions);
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, professionalId, revision]);

  if (!user?.isAdmin) return null;

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day) ? current.filter((entry) => entry !== day) : [...current, day],
    );
  }

  async function handleCreate() {
    if (!token) return;
    if (!professionalId) {
      setError("Selecione um profissional.");
      return;
    }
    if (days.length === 0) {
      setError("Selecione pelo menos um dia da semana.");
      return;
    }
    if (!startTime || !endTime || startTime >= endTime) {
      setError("Informe um intervalo de horário válido.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createWorkSchedule(
        {
          professional_id: Number(professionalId),
          days_of_week: days,
          start_time: startTime,
          end_time: endTime,
        },
        token,
      );
      setDays([]);
      setRevision((value) => value + 1);
      toast.success("Horário de trabalho adicionado");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateException() {
    if (!token || !professionalId) return;
    if (!exceptionDate) {
      setError("Informe a data da exceção.");
      return;
    }
    if (exceptionStart && exceptionEnd && exceptionStart >= exceptionEnd) {
      setError("O horário final deve ser maior que o inicial.");
      return;
    }
    if ((exceptionStart && !exceptionEnd) || (!exceptionStart && exceptionEnd)) {
      setError("Informe os dois horários ou deixe ambos vazios.");
      return;
    }

    setSavingException(true);
    setError("");
    try {
      const created = await createScheduleException(
        {
          professional_id: Number(professionalId),
          date: exceptionDate,
          type: exceptionType,
          start_time: exceptionStart || null,
          end_time: exceptionEnd || null,
        },
        token,
      );
      setExceptions((current) => [...current, created]);
      setExceptionStart("");
      setExceptionEnd("");
      toast.success("Exceção adicionada");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSavingException(false);
    }
  }

  async function handleDeleteException(exception: ApiScheduleException) {
    if (!token) return;
    if (!window.confirm(`Excluir a exceção de ${exception.date}?`)) return;
    try {
      await deleteScheduleException(exception.id, token);
      setExceptions((current) => current.filter((entry) => entry.id !== exception.id));
      toast.success("Exceção removida");
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  async function handleDelete(schedule: ApiWorkSchedule) {
    if (!token) return;
    if (!window.confirm(`Excluir o horário de ${WEEKDAYS[schedule.day_of_week]}?`)) return;
    try {
      await deleteWorkSchedule(schedule.id, token);
      setSchedules((current) => current.filter((entry) => entry.id !== schedule.id));
      toast.success("Horário removido");
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">
          <CalendarClock className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Disponibilidade</h2>
          <p className="text-xs text-gray-500">
            Defina os dias e horários em que cada profissional atende.
          </p>
        </div>
      </div>

      {(error || usersError) && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error || usersError}
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="availability-professional"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Profissional
          </label>
          <select
            id="availability-professional"
            value={professionalId}
            disabled={usersLoading || professionals.length === 0}
            onChange={(event) => setProfessionalId(event.currentTarget.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            <option value="">
              {usersLoading ? "Carregando profissionais..." : "Selecione um profissional"}
            </option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.professional!.id}>
                {professional.name}
              </option>
            ))}
          </select>
        </div>

        {professionalId && (
          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-gray-500">Carregando horários...</p>
            ) : schedules.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum horário cadastrado.</p>
            ) : (
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                >
                  <span className="text-sm text-gray-700">
                    {WEEKDAYS[schedule.day_of_week]} · {schedule.start_time}–{schedule.end_time}
                  </span>
                  <button
                    onClick={() => void handleDelete(schedule)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    title="Excluir horário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {professionalId && (
          <div className="space-y-2 rounded-lg border border-gray-200 p-3">
            <p className="text-sm font-medium text-gray-700">Exceções de agenda</p>
            {exceptions.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma exceção cadastrada.</p>
            ) : (
              exceptions.map((exception) => (
                <div
                  key={exception.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                >
                  <span className="text-sm text-gray-700">
                    {exception.date} · {exception.type === "blocked" ? "Bloqueio" : "Abertura"} ·{" "}
                    {exception.start_time && exception.end_time
                      ? `${exception.start_time}–${exception.end_time}`
                      : "dia inteiro"}
                  </span>
                  <button
                    onClick={() => void handleDeleteException(exception)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    title="Excluir exceção"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
            <div className="flex flex-wrap items-end gap-2 pt-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500" htmlFor="exception-date">
                  Data
                </label>
                <input
                  id="exception-date"
                  type="date"
                  value={exceptionDate}
                  onChange={(event) => setExceptionDate(event.currentTarget.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500" htmlFor="exception-type">
                  Tipo
                </label>
                <select
                  id="exception-type"
                  value={exceptionType}
                  onChange={(event) =>
                    setExceptionType(event.currentTarget.value as ScheduleExceptionType)
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="blocked">Bloqueio</option>
                  <option value="open">Abertura</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500" htmlFor="exception-start">
                  Início
                </label>
                <input
                  id="exception-start"
                  type="time"
                  value={exceptionStart}
                  onChange={(event) => setExceptionStart(event.currentTarget.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500" htmlFor="exception-end">
                  Fim
                </label>
                <input
                  id="exception-end"
                  type="time"
                  value={exceptionEnd}
                  onChange={(event) => setExceptionEnd(event.currentTarget.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={() => void handleCreateException()}
                disabled={savingException || !professionalId}
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {savingException ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Adicionar
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Deixe os horários vazios para bloquear ou abrir o dia inteiro.
            </p>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 p-3">
          <p className="mb-2 text-sm font-medium text-gray-700">Adicionar horário</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {WEEKDAYS.map((label, day) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  days.includes(day)
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500" htmlFor="work-start">
                Início
              </label>
              <input
                id="work-start"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.currentTarget.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500" htmlFor="work-end">
                Fim
              </label>
              <input
                id="work-end"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.currentTarget.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => void handleCreate()}
              disabled={saving || !professionalId}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
