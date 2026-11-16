import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, Clock, CheckCircle } from "lucide-react";
import {
  format,
  addDays,
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
import { BackButton } from "../../components/BackButton";
import { SiteIcon } from "../../components/SiteIcon";
import { CalendarNavigation } from "../../components/appointments/CalendarNavigation";
import { useSite, useTerminology } from "../../config/SiteContext";
import { useAuth } from "../../context/AuthContext";
import { useProcedures } from "../../context/ProceduresContext";
import { useAppointments } from "../../context/AppointmentsContext";
import { errorMessage } from "../../services/api";
import {
  createSchedule,
  getAvailabilityForDate,
  getAvailabilitySummary,
  getAvailableDates,
} from "../../services/schedules";
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
  const [step, setStep] = useState<Step>("procedure");
  const [selectedProcedureId, setSelectedProcedureId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availability, setAvailability] = useState<
    { name: string; professionalId: number; slots: AvailabilitySlot[] }[]
  >([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [procedureAvailability, setProcedureAvailability] = useState<Record<number, string | null>>(
    {},
  );
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [datesLoadedProcedureId, setDatesLoadedProcedureId] = useState<number | null>(null);
  const [datesPage, setDatesPage] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const noAvailabilityNotified = useRef(false);
  const treatmentHandled = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = startOfDay(new Date());
  const monthLabel = format(currentMonth, "MMMM yyyy", { locale: ptBR });
  const calendarLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  const procedure = active.find((entry) => entry.id === selectedProcedureId);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const availableDateSet = new Set(availableDates);
  const datesPageSize = 7;
  const datesPageCount = Math.max(1, Math.ceil(availableDates.length / datesPageSize));
  const visibleDates = availableDates.slice(
    datesPage * datesPageSize,
    (datesPage + 1) * datesPageSize,
  );

  useEffect(() => {
    if (!token || !user?.clientId) return;
    const controller = new AbortController();
    const from = format(today, "yyyy-MM-dd");
    const to = format(addDays(today, 59), "yyyy-MM-dd");
    setSummaryLoaded(false);
    getAvailabilitySummary(token, from, to, controller.signal)
      .then((summary) => {
        if (controller.signal.aborted) return;
        setProcedureAvailability(
          Object.fromEntries(summary.map((entry) => [entry.procedure_id, entry.next_date])),
        );
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSummaryLoaded(true);
        }
      });
    return () => controller.abort();
  }, [token, user?.clientId]);

  useEffect(() => {
    if (!summaryLoaded || treatmentHandled.current) return;
    if (!treatmentId) {
      treatmentHandled.current = true;
      return;
    }
    const match = active.find((entry) => String(entry.id) === treatmentId);
    if (!match || !procedureAvailability[match.id]) {
      toast.error(
        match
          ? "Este procedimento está sem disponibilidade no momento."
          : "Procedimento indisponível.",
      );
      treatmentHandled.current = true;
      return;
    }
    setSelectedProcedureId(match.id);
    setStep("datetime");
    treatmentHandled.current = true;
  }, [active, procedureAvailability, summaryLoaded, treatmentId]);

  useEffect(() => {
    if (!summaryLoaded || noAvailabilityNotified.current) return;
    if (active.length > 0 && active.every((procedure) => !procedureAvailability[procedure.id])) {
      toast.error("Nenhum procedimento com disponibilidade no momento.");
      noAvailabilityNotified.current = true;
    }
  }, [active, procedureAvailability, summaryLoaded]);

  useEffect(() => {
    if (!selectedProcedureId || !token) {
      setAvailableDates([]);
      setDatesLoadedProcedureId(null);
      return;
    }
    const controller = new AbortController();
    const from = format(today, "yyyy-MM-dd");
    const to = format(addDays(today, 59), "yyyy-MM-dd");
    setDatesLoading(true);
    setDatesPage(0);
    getAvailableDates(token, selectedProcedureId, from, to, controller.signal)
      .then((dates) => {
        if (controller.signal.aborted) return;
        setAvailableDates(dates);
        setDatesLoadedProcedureId(selectedProcedureId);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setDatesLoading(false);
      });
    return () => controller.abort();
  }, [selectedProcedureId, token]);

  useEffect(() => {
    if (
      step !== "datetime" ||
      datesLoadedProcedureId !== selectedProcedureId ||
      datesLoading ||
      availableDates.length > 0
    ) {
      return;
    }
    toast.error("Sem disponibilidade neste período.");
  }, [availableDates.length, datesLoadedProcedureId, datesLoading, selectedProcedureId, step]);

  useEffect(() => {
    if (!selectedDate || !selectedProcedureId) {
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
      selectedProcedureId,
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
  }, [selectedDate, selectedProcedureId, user?.clientId, token]);

  function handleDateSelect(date: Date) {
    if (isBefore(date, today)) return;
    if (!availableDateSet.has(format(date, "yyyy-MM-dd"))) return;
    setCurrentMonth(date);
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
      <BackButton onClick={handleBack} label="Voltar" />
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Novo Agendamento</h1>
        <p className="text-xs text-gray-400">
          {step === "procedure" && copy("Escolha o procedimento")}
          {step === "datetime" && "Escolha data e horário"}
          {step === "confirm" && "Confirme os detalhes"}
        </p>
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

      {step === "procedure" &&
        (!summaryLoaded ? (
          <div role="status" aria-live="polite" className="space-y-3">
            <p className="py-4 text-center text-sm text-gray-400">
              Carregando procedimentos disponíveis...
            </p>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-xl border border-gray-100 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-gray-100" />
                    <div className="h-3 w-1/4 rounded bg-gray-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {active.length === 0 && (
              <p className="py-12 text-center text-gray-400">
                {copy("Nenhum procedimento disponível.")}
              </p>
            )}
            {active.map((entry) => {
              const unavailable = !procedureAvailability[entry.id];
              return (
                <button
                  key={entry.id}
                  disabled={unavailable}
                  onClick={() => {
                    if (unavailable) return;
                    setSelectedProcedureId(entry.id);
                    setSelectedDate(null);
                    setSelectedSlot(null);
                    setStep("datetime");
                  }}
                  className={`w-full rounded-xl p-4 text-left shadow-sm transition-all ${
                    unavailable
                      ? "cursor-not-allowed border border-gray-100 bg-gray-50 opacity-60"
                      : "border border-gray-100 bg-white hover:border-brand-300 hover:shadow"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                        unavailable ? "bg-gray-200" : "bg-brand-100"
                      }`}
                    >
                      <SiteIcon
                        name={site.catalog.icon}
                        className={`h-5 w-5 ${unavailable ? "text-gray-400" : "text-brand-700"}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-medium ${unavailable ? "text-gray-400" : "text-gray-900"}`}
                      >
                        {entry.name}
                      </p>
                      {entry.duration && !unavailable && (
                        <p className="text-sm text-gray-400">{entry.duration}</p>
                      )}
                      {unavailable && <p className="text-sm text-gray-400">Sem disponibilidade</p>}
                    </div>
                    {entry.price && !unavailable && (
                      <span className="flex-shrink-0 text-sm font-semibold text-brand-700">
                        {entry.price}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}

      {step === "datetime" && procedure && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-md lg:col-span-2">
              <CalendarNavigation
                label={calendarLabel}
                onPrevious={() => setCurrentMonth(subMonths(currentMonth, 1))}
                onNext={() => setCurrentMonth(addMonths(currentMonth, 1))}
                onToday={() => setCurrentMonth(today)}
              />

              <div className="mb-2 grid grid-cols-7">
                {WEEKDAYS.map((weekday) => (
                  <div
                    key={weekday}
                    className="py-1 text-center text-xs font-semibold text-[#9ca3af]"
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
                  const isAvailable =
                    !datesLoading && availableDateSet.has(format(day, "yyyy-MM-dd"));
                  const isSelected = selectedDate?.toDateString() === day.toDateString();
                  const isTodayDay = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isPast || !isAvailable}
                      aria-current={isTodayDay ? "date" : undefined}
                      title={isTodayDay ? "Hoje" : undefined}
                      onClick={() => handleDateSelect(day)}
                      className={[
                        "flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition-all",
                        isSelected
                          ? "bg-brand-700 text-white shadow-md"
                          : isPast || !isAvailable
                            ? "text-[#d1d5db]"
                            : "text-[#374151] hover:bg-brand-100 hover:text-brand-700",
                        isPast || !isAvailable ? "cursor-not-allowed" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-brand-100 bg-white p-6 shadow-md">
              <h3 className="mb-3 text-base font-bold text-brand-800">Resumo</h3>
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

              <div className="mt-5 flex min-h-0 flex-1 flex-col border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-800">Datas disponíveis</h4>
                {datesLoading ? (
                  <p className="mt-2 text-sm text-gray-500">Carregando datas...</p>
                ) : availableDates.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">Sem datas disponíveis.</p>
                ) : (
                  <>
                    <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                      {visibleDates.map((date) => {
                        const parsed = new Date(`${date}T00:00:00`);
                        const selected = selectedDate
                          ? format(selectedDate, "yyyy-MM-dd") === date
                          : false;
                        return (
                          <button
                            key={date}
                            type="button"
                            onClick={() => handleDateSelect(parsed)}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                              selected
                                ? "bg-brand-700 text-white"
                                : "bg-brand-50 text-brand-800 hover:bg-brand-100"
                            }`}
                          >
                            <span className="capitalize">
                              {format(parsed, "EEE, dd/MM", { locale: ptBR })}
                            </span>
                            {selected && <span className="text-xs">Selecionado</span>}
                          </button>
                        );
                      })}
                    </div>
                    {datesPageCount > 1 && (
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          aria-label="Página anterior de datas"
                          disabled={datesPage === 0}
                          onClick={() => setDatesPage((value) => Math.max(0, value - 1))}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-xs text-gray-500">
                          {datesPage + 1} / {datesPageCount}
                        </span>
                        <button
                          type="button"
                          aria-label="Próxima página de datas"
                          disabled={datesPage >= datesPageCount - 1}
                          onClick={() =>
                            setDatesPage((value) => Math.min(datesPageCount - 1, value + 1))
                          }
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {selectedDate && (
            <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-md">
              <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-brand-800">
                <Clock className="h-4 w-4 text-brand-700" />
                Horários disponíveis
              </h3>
              <p className="mb-4 text-xs capitalize text-[#9ca3af]">
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
                      <p className="mb-2 text-sm font-medium text-gray-700">{professional.name}</p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
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
                              className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
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
