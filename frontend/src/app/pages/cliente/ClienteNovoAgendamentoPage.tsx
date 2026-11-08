import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, Clock, CheckCircle } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { SiteIcon } from "../../components/SiteIcon";
import { useSite, useTerminology } from "../../config/SiteContext";
import { useAuth } from "../../context/AuthContext";
import { useProcedures } from "../../context/ProceduresContext";
import { useAppointments } from "../../context/AppointmentsContext";
import { errorMessage } from "../../services/api";
import { createSchedule, getAvailabilityForDate } from "../../services/schedules";
import type { AvailabilitySlot } from "../../services/schedules";
import { displayDateToIso } from "../../utils/appointments/appointment";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Step = "procedure" | "datetime" | "confirm" | "done";

interface SelectedSlot {
  professionalId: number;
  professionalName: string;
  time: string;
}

export function ClienteNovoAgendamentoPage() {
  const copy = useTerminology();
  const site = useSite();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const treatmentId = searchParams.get("treatmentId");
  const { user, token } = useAuth();
  const { procedures } = useProcedures();
  const { reload } = useAppointments();
  const active = procedures.filter((procedure) => procedure.status === "Ativo");
  const initialProcedure = treatmentId
    ? active.find((procedure) => String(procedure.id) === treatmentId)
    : undefined;
  const [step, setStep] = useState<Step>(initialProcedure ? "datetime" : "procedure");
  const [selectedProcedureId, setSelectedProcedureId] = useState<number | null>(
    initialProcedure?.id ?? null,
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availability, setAvailability] = useState<
    { name: string; professionalId: number; slots: AvailabilitySlot[] }[]
  >([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = startOfDay(new Date());
  const procedure = active.find((entry) => entry.id === selectedProcedureId);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  useEffect(() => {
    if (!treatmentId || selectedProcedureId !== null) return;
    const match = procedures.find(
      (entry) => entry.status === "Ativo" && String(entry.id) === treatmentId,
    );
    if (match) {
      setSelectedProcedureId(match.id);
      setStep("datetime");
    }
  }, [procedures, selectedProcedureId, treatmentId]);

  useEffect(() => {
    if (!selectedDate) {
      setAvailability([]);
      setSelectedSlot(null);
      return;
    }
    if (!user?.clientId || !token) {
      setError("Entre com uma conta de cliente para agendar.");
      return;
    }

    const controller = new AbortController();
    setAvailabilityLoading(true);
    setError("");
    setSelectedSlot(null);
    getAvailabilityForDate(
      token,
      displayDateToIso(format(selectedDate, "dd/MM/yyyy")),
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) setAvailability(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setAvailabilityLoading(false);
      });
    return () => controller.abort();
  }, [selectedDate, user?.clientId, token]);

  function handleDateSelect(date: Date) {
    if (isBefore(date, today)) return;
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  function handleBack() {
    if (step === "procedure") navigate("/cliente/agendamentos");
    else if (step === "datetime") setStep("procedure");
    else if (step === "confirm") setStep("datetime");
  }

  async function handleConfirm() {
    if (!user?.clientId || !token || !selectedDate || !selectedSlot || !procedure) return;
    setSaving(true);
    setError("");
    try {
      await createSchedule(
        {
          client_id: user.clientId,
          professional_id: selectedSlot.professionalId,
          procedure_id: procedure.id,
          date: displayDateToIso(format(selectedDate, "dd/MM/yyyy")),
          start_time: selectedSlot.time,
          session: 1,
        },
        token,
      );
      reload();
      setStep("done");
      toast.success("Agendamento criado");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  if (step === "done") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agendado!</h2>
          <p className="text-gray-500 mt-2">
            <span className="font-medium text-gray-700">{procedure?.name}</span>
            {selectedDate && (
              <>
                {" "}
                para{" "}
                <span className="font-medium text-gray-700">
                  {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>{" "}
                às <span className="font-medium text-gray-700">{selectedSlot?.time}</span>
              </>
            )}{" "}
            com <span className="font-medium text-gray-700">{selectedSlot?.professionalName}</span>.
          </p>
        </div>
        <button
          onClick={() => navigate("/cliente/agendamentos")}
          className="w-full bg-brand-700 text-white py-3 rounded-xl font-medium hover:bg-brand-600 transition-colors"
        >
          Ver meus agendamentos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Novo Agendamento</h1>
          <p className="text-xs text-gray-400">
            {step === "procedure" && copy("Escolha o procedimento")}
            {step === "datetime" && "Escolha data e horário"}
            {step === "confirm" && "Confirme os detalhes"}
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-2 mb-8">
        {(["procedure", "datetime", "confirm"] as Step[]).map((name, index) => (
          <div
            key={name}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step === "confirm" || (step === "datetime" && index === 0) || step === name
                ? "bg-brand-700"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {step === "procedure" && (
        <div className="space-y-3">
          {active.length === 0 && (
            <p className="text-center text-gray-400 py-12">
              {copy("Nenhum procedimento disponível.")}
            </p>
          )}
          {active.map((entry) => (
            <button
              key={entry.id}
              onClick={() => {
                setSelectedProcedureId(entry.id);
                setSelectedDate(null);
                setSelectedSlot(null);
                setStep("datetime");
              }}
              className="w-full text-left bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-brand-300 hover:shadow transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <SiteIcon name={site.catalog.icon} className="w-5 h-5 text-brand-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{entry.name}</p>
                  {entry.duration && <p className="text-sm text-gray-400">{entry.duration}</p>}
                </div>
                {entry.price && (
                  <span className="text-sm font-semibold text-brand-700 flex-shrink-0">
                    {entry.price}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {step === "datetime" && procedure && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-brand-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <button
                  aria-label="Mês anterior"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-100 transition-colors text-brand-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-bold text-brand-800 capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <button
                  aria-label="Próximo mês"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-100 transition-colors text-brand-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {WEEKDAYS.map((weekday) => (
                  <div
                    key={weekday}
                    className="text-center text-xs font-semibold text-[#9ca3af] py-1"
                  >
                    {weekday}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startPadding }).map((_, index) => (
                  <div key={`pad-${index}`} />
                ))}
                {days.map((day) => {
                  const isPast = isBefore(day, today);
                  const isSelected = selectedDate?.toDateString() === day.toDateString();
                  const isTodayDay = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleDateSelect(day)}
                      className={[
                        "aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center",
                        isPast
                          ? "text-[#d1d5db] cursor-not-allowed"
                          : isSelected
                            ? "bg-brand-700 text-white shadow-md"
                            : isTodayDay
                              ? "bg-brand-100 text-brand-700 font-bold ring-2 ring-brand-300"
                              : "text-[#374151] hover:bg-brand-100 hover:text-brand-700",
                      ].join(" ")}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="bg-white rounded-2xl shadow-md border border-brand-100 p-6">
                <h3 className="text-base font-bold text-brand-800 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-700" />
                  Horários disponíveis
                </h3>
                <p className="text-xs text-[#9ca3af] mb-4 capitalize">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                {availabilityLoading ? (
                  <p className="text-sm text-gray-500">Carregando horários...</p>
                ) : availability.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum horário disponível nesta data.</p>
                ) : (
                  <div className="space-y-4">
                    {availability.map((professional) => (
                      <div key={professional.professionalId}>
                        <p className="mb-2 text-sm font-medium text-gray-700">
                          {professional.name}
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {professional.slots.map((slot) => {
                            const selected =
                              selectedSlot?.professionalId === professional.professionalId &&
                              selectedSlot.time === slot.start_time;
                            return (
                              <button
                                key={`${professional.professionalId}-${slot.start_time}`}
                                type="button"
                                onClick={() => {
                                  setSelectedSlot({
                                    professionalId: professional.professionalId,
                                    professionalName: professional.name,
                                    time: slot.start_time,
                                  });
                                  setStep("confirm");
                                }}
                                className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                  selected
                                    ? "bg-brand-700 text-white"
                                    : "bg-brand-50 text-brand-800 hover:bg-brand-100"
                                }`}
                              >
                                {slot.start_time}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-brand-100 p-6 h-fit">
            <h3 className="text-base font-bold text-brand-800 mb-3">Resumo</h3>
            <p className="text-sm font-medium text-gray-900">{procedure.name}</p>
            <p className="mt-1 text-sm text-gray-500">{procedure.duration}</p>
            <p className="mt-1 text-sm font-semibold text-brand-700">{procedure.price}</p>
            {selectedSlot && (
              <div className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
                <p>{selectedSlot.professionalName}</p>
                <p>
                  {format(selectedDate!, "dd/MM/yyyy", { locale: ptBR })} às {selectedSlot.time}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {step === "confirm" && procedure && selectedDate && selectedSlot && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-brand-100 p-6 space-y-4">
          <h2 className="text-xl font-bold text-brand-800">Confirmar agendamento</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Procedimento:</strong> {procedure.name}
            </p>
            <p>
              <strong>Profissional:</strong> {selectedSlot.professionalName}
            </p>
            <p>
              <strong>Data:</strong> {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às{" "}
              {selectedSlot.time}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("datetime")}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Voltar
            </button>
            <button
              onClick={() => void handleConfirm()}
              disabled={saving}
              className="flex-1 rounded-lg bg-brand-700 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-gray-300"
            >
              {saving ? "Confirmando..." : "Confirmar agendamento"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
