import { useState } from "react";
import { X } from "lucide-react";
import type { Appointment } from "../../config/types";
import { useTerminology } from "../../config/SiteContext";
import { useProcedures } from "../../context/ProceduresContext";
import { useClients } from "../../context/ClientsContext";
import { availableTimes } from "../../utils/appointments/constants";
import { parseDurationMin } from "../../utils/appointments/appointment";
import { AppointmentDatePicker } from "./AppointmentDatePicker";
export function CreateAppointmentModal({
  open,
  onClose,
  onCreate,
  today,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (appointment: Omit<Appointment, "id">) => void;
  today: string;
}) {
  const copy = useTerminology();
  const { procedures } = useProcedures();
  const { clients, loading: clientsLoading, error: clientsError } = useClients();
  const [selectedProcedure, setSelectedProcedure] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const handleCreateAppointment = () => {
    if (!selectedProcedure || !selectedClient || !selectedDate || !selectedTime) return;
    const procedure = procedures.find((p) => p.name === selectedProcedure);
    onCreate({
      client: selectedClient,
      procedure: selectedProcedure,
      date: selectedDate,
      time: selectedTime,
      status: "Pendente",
      durationMin: procedure ? parseDurationMin(procedure.duration) : 60,
    });
    setSelectedProcedure("");
    setSelectedClient("");
    setSelectedDate(null);
    setSelectedTime("");
  };
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
              value={selectedProcedure}
              onChange={(e) => setSelectedProcedure(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            >
              <option value="">{copy("Selecione um procedimento")}</option>
              {procedures
                .filter((p) => p.status === "Ativo")
                .map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.duration})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="appointment-client"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Cliente *
            </label>
            <select
              id="appointment-client"
              value={selectedClient}
              disabled={clientsLoading || Boolean(clientsError) || clients.length === 0}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            >
              <option value="">
                {clientsLoading ? "Carregando clientes..." : "Selecione um cliente"}
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {clientsError && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {clientsError}
              </p>
            )}
            {!clientsLoading && !clientsError && clients.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">
                A seleção requer uma conta administrativa com clientes cadastrados.
              </p>
            )}
            {/* TODO(integracao): persistir agendamentos na API usando o ID do cliente; a agenda continua demonstrativa. */}
            <p className="mt-2 text-sm text-amber-800">
              Agendamento demonstrativo: será salvo apenas neste navegador.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
            <AppointmentDatePicker
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              today={today}
            />
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Horário * <span className="text-gray-400 font-normal">— {selectedDate}</span>
              </label>
              <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                {availableTimes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${selectedTime === t ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
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
            onClick={handleCreateAppointment}
            disabled={!selectedProcedure || !selectedClient || !selectedDate || !selectedTime}
            className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Criar Agendamento
          </button>
        </div>
      </div>
    </div>
  );
}
