import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTerminology } from "../../config/SiteContext";
import { useAuth } from "../../context/AuthContext";
import { useProcedures } from "../../context/ProceduresContext";
import { useUsers } from "../../context/UsersContext";
import type { AppointmentInput } from "../../context/AppointmentsContext";
import { errorMessage } from "../../services/api";
import { getAvailableSlots } from "../../services/schedules";
import { displayDateToIso } from "../../utils/appointments/appointment";
import { AppointmentDatePicker } from "./AppointmentDatePicker";

export function CreateAppointmentModal({
  open,
  onClose,
  onCreate,
  today,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (appointment: AppointmentInput) => Promise<void>;
  today: string;
}) {
  const copy = useTerminology();
  const { token } = useAuth();
  const { procedures } = useProcedures();
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const [selectedProcedureId, setSelectedProcedureId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [session, setSession] = useState(1);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const clients = users.filter((user) => user.client);
  const professionals = users.filter((user) => user.professional);
  const procedure = procedures.find((entry) => String(entry.id) === selectedProcedureId);

  useEffect(() => {
    if (!open || !token || !selectedProfessionalId || !selectedDate || !selectedProcedureId) {
      setSlots([]);
      setSlotsError("");
      return;
    }

    const controller = new AbortController();
    setSlotsLoading(true);
    setSlotsError("");
    setSelectedTime("");
    getAvailableSlots(
      token,
      Number(selectedProfessionalId),
      displayDateToIso(selectedDate),
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) setSlots(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setSlotsError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setSlotsLoading(false);
      });

    return () => controller.abort();
  }, [open, token, selectedProfessionalId, selectedDate, selectedProcedureId]);

  async function handleCreateAppointment() {
    if (!selectedProcedureId || !selectedClientId || !selectedProfessionalId || !selectedDate) {
      return;
    }
    if (!selectedTime) {
      setError("Selecione um horário disponível.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onCreate({
        clientId: Number(selectedClientId),
        professionalId: Number(selectedProfessionalId),
        procedureId: Number(selectedProcedureId),
        date: selectedDate,
        time: selectedTime,
        session: procedure?.triagem ? session : 1,
      });
      setSelectedProcedureId("");
      setSelectedClientId("");
      setSelectedProfessionalId("");
      setSelectedDate(null);
      setSelectedTime("");
      setSession(1);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Novo Agendamento</h2>
          <button
            aria-label="Fechar novo agendamento"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          <div>
            <label
              htmlFor="appointment-procedure"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              {copy("Procedimento *")}
            </label>
            <select
              id="appointment-procedure"
              value={selectedProcedureId}
              onChange={(e) => {
                setSelectedProcedureId(e.target.value);
                setSession(1);
                setSelectedTime("");
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            >
              <option value="">{copy("Selecione um procedimento")}</option>
              {procedures
                .filter((entry) => entry.status === "Ativo")
                .map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name} ({entry.duration})
                  </option>
                ))}
            </select>
          </div>

          {procedure?.triagem && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSession(0)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium ${session === 0 ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700"}`}
                >
                  Triagem ({procedure.triagemMinutes} min)
                </button>
                <button
                  type="button"
                  onClick={() => setSession(1)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium ${session === 1 ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700"}`}
                >
                  Sessão ({procedure.duration})
                </button>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="appointment-client"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Cliente *
            </label>
            <select
              id="appointment-client"
              value={selectedClientId}
              disabled={usersLoading || Boolean(usersError) || clients.length === 0}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            >
              <option value="">
                {usersLoading ? "Carregando clientes..." : "Selecione um cliente"}
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.client!.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {usersError && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {usersError}
              </p>
            )}
            {!usersLoading && !usersError && clients.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">
                Cadastre um cliente antes de criar um agendamento.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="appointment-professional"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Profissional *
            </label>
            <select
              id="appointment-professional"
              value={selectedProfessionalId}
              disabled={usersLoading || Boolean(usersError) || professionals.length === 0}
              onChange={(e) => setSelectedProfessionalId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
            <AppointmentDatePicker
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              selectedDate={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedTime("");
              }}
              today={today}
            />
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Horário * <span className="text-gray-400 font-normal">— {selectedDate}</span>
              </label>
              {slotsLoading ? (
                <p className="text-sm text-gray-500">Carregando horários...</p>
              ) : slotsError ? (
                <p role="alert" className="text-sm text-red-700">
                  {slotsError}
                </p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhum horário disponível. Verifique a disponibilidade do profissional.
                </p>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                  {slots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${selectedTime === time ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 md:p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => void handleCreateAppointment()}
            disabled={
              saving ||
              !selectedProcedureId ||
              !selectedClientId ||
              !selectedProfessionalId ||
              !selectedDate ||
              !selectedTime
            }
            className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? "Criando..." : "Criar Agendamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
