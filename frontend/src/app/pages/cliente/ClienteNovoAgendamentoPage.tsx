import { useTerminology, useSite } from "../../config/SiteContext";
import { SiteIcon } from "../../components/SiteIcon";
import { demoOccupiedSlots } from "../../config/agenda";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Clock, Calendar, CheckCircle } from "lucide-react";
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
import { useProcedures } from "../../context/ProceduresContext";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Step = "procedure" | "datetime" | "confirm" | "done";

export function ClienteNovoAgendamentoPage() {
  const copy = useTerminology();
  const site = useSite();
  const { agenda } = site;
  const navigate = useNavigate();
  const { procedures } = useProcedures();
  const active = procedures.filter((p) => p.status === "Ativo");
  const [step, setStep] = useState<Step>("procedure");
  const [selectedProcedureId, setSelectedProcedureId] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const today = startOfDay(new Date());
  const procedure = active.find((p) => p.id === selectedProcedureId);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });
  const startPadding = getDay(monthStart);
  const occupiedToday = selectedDate ? demoOccupiedSlots(agenda, selectedDate) : [];

  function handleDateSelect(date: Date) {
    if (isBefore(date, today)) return;

    setSelectedDate(date);
    setSelectedTime(null);
  }

  function handleBack() {
    if (step === "procedure") navigate("/cliente/agendamentos");
    else if (step === "datetime") setStep("procedure");
    else if (step === "confirm") setStep("datetime");
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
                às <span className="font-medium text-gray-700">{selectedTime}</span>
              </>
            )}{" "}
            foi enviado para confirmação.
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

      <div className="flex gap-2 mb-8">
        {(["procedure", "datetime", "confirm"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${step === "confirm" || (step === "datetime" && i === 0) || step === s ? "bg-brand-700" : "bg-gray-200"}`}
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
          {active.map((proc) => (
            <button
              key={proc.id}
              onClick={() => {
                setSelectedProcedureId(proc.id);
                setStep("datetime");
              }}
              className="w-full text-left bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-brand-300 hover:shadow transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <SiteIcon name={site.catalog.icon} className="w-5 h-5 text-brand-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{proc.name}</p>
                  {proc.duration && <p className="text-sm text-gray-400">{proc.duration}</p>}
                </div>
                {proc.price && (
                  <span className="text-sm font-semibold text-brand-700 flex-shrink-0">
                    {proc.price}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {step === "datetime" && (
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
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="text-center text-xs font-semibold text-[#9ca3af] py-1">
                    {wd}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startPadding }).map((_, i) => (
                  <div key={`pad-${i}`} />
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
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {agenda.timeSlots.map((slot) => {
                    const occupied = occupiedToday.includes(slot);
                    const isChosen = selectedTime === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={occupied}
                        onClick={() => setSelectedTime(slot)}
                        className={[
                          "py-2.5 rounded-lg text-sm font-medium transition-all border",
                          occupied
                            ? "border-[#f3f4f6] bg-[#f9fafb] text-[#d1d5db] cursor-not-allowed line-through"
                            : isChosen
                              ? "bg-brand-700 text-white border-brand-700 shadow-md"
                              : "border-brand-100 text-brand-800 hover:border-brand-300 hover:bg-brand-100",
                        ].join(" ")}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md border border-brand-100 p-6 sticky top-20">
              <h3 className="text-base font-bold text-brand-800 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-700" />
                Resumo
              </h3>
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-xs text-[#9ca3af] font-medium uppercase tracking-wide">
                    {copy("Tratamento")}
                  </p>
                  <p className="text-sm font-semibold text-brand-800 mt-0.5">{procedure?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9ca3af] font-medium uppercase tracking-wide">Data</p>
                  <p className="text-sm font-semibold text-brand-800 mt-0.5">
                    {selectedDate ? (
                      format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span className="text-[#d1d5db] font-normal">Selecione uma data</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#9ca3af] font-medium uppercase tracking-wide">
                    Horário
                  </p>
                  <p className="text-sm font-semibold text-brand-800 mt-0.5">
                    {selectedTime ?? (
                      <span className="text-[#d1d5db] font-normal">Selecione um horário</span>
                    )}
                  </p>
                </div>
                {procedure?.price && (
                  <div className="pt-2 border-t border-brand-100">
                    <p className="text-xs text-[#9ca3af] font-medium uppercase tracking-wide">
                      Valor
                    </p>
                    <p className="text-lg font-bold text-brand-700 mt-0.5">{procedure.price}</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep("confirm")}
                className={[
                  "w-full py-3 rounded-lg font-medium transition-all text-sm",
                  selectedDate && selectedTime
                    ? "bg-brand-700 text-white hover:bg-brand-600 shadow-md hover:shadow-lg"
                    : "bg-[#f3f4f6] text-[#d1d5db] cursor-not-allowed",
                ].join(" ")}
              >
                Continuar
              </button>

              {(!selectedDate || !selectedTime) && (
                <p className="text-xs text-center text-[#9ca3af] mt-2">
                  {!selectedDate
                    ? "Selecione uma data para continuar"
                    : "Selecione um horário para continuar"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {step === "confirm" && procedure && (
        <div className="max-w-md space-y-6">
          <div className="bg-white border border-brand-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-brand-800 text-lg">Resumo do agendamento</h2>
            <div className="space-y-3 text-sm">
              <Row label={copy("Procedimento")} value={procedure.name} />
              {procedure.duration && <Row label="Duração" value={procedure.duration} />}
              {procedure.price && <Row label="Valor" value={procedure.price} />}
              {selectedDate && (
                <Row label="Data" value={format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} />
              )}
              {selectedTime && <Row label="Horário" value={selectedTime} />}
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">{site.content.bookingConfirmation}</p>
          <button
            onClick={() => setStep("done")}
            className="w-full bg-brand-700 text-white py-3 rounded-xl font-medium hover:bg-brand-600 transition-colors shadow-lg"
          >
            Confirmar agendamento
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-brand-800">{value}</span>
    </div>
  );
}
