import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Clock, Calendar, Sparkles, CheckCircle } from "lucide-react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isToday, isBefore, startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProcedures } from "../../context/ProceduresContext";

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00",
];

const BLOCKED_SLOTS = ["10:00", "14:00"];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getMockOccupied(date: Date): string[] {
  const day = date.getDate();
  const extra: string[] = [];
  if (day % 4 === 0) extra.push("09:00");
  if (day % 5 === 0) extra.push("11:00");
  if (day % 3 === 0) extra.push("17:00");
  return [...BLOCKED_SLOTS, ...extra];
}

type Step = "procedure" | "datetime" | "confirm" | "done";

export function ClienteNovoAgendamentoPage() {
  const navigate = useNavigate();
  const { procedures } = useProcedures();
  const active = procedures.filter((p) => p.status === "Ativo");

  const [step, setStep] = useState<Step>("procedure");
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const procedure = active.find((p) => p.id === selectedProcedureId);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);
  const occupiedToday = selectedDate ? getMockOccupied(selectedDate) : [];

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
              <> para <span className="font-medium text-gray-700">
                {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
              </span> às <span className="font-medium text-gray-700">{selectedTime}</span></>
            )}
            {" "}foi enviado para confirmação.
          </p>
        </div>
        <button
          onClick={() => navigate("/cliente/agendamentos")}
          className="w-full bg-[#631a1d] text-white py-3 rounded-xl font-medium hover:bg-[#751e22] transition-colors"
        >
          Ver meus agendamentos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Novo Agendamento</h1>
          <p className="text-xs text-gray-400">
            {step === "procedure" && "Escolha o procedimento"}
            {step === "datetime" && "Escolha data e horário"}
            {step === "confirm" && "Confirme os detalhes"}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {(["procedure", "datetime", "confirm"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step === "confirm" || (step === "datetime" && i === 0) || step === s
                ? "bg-[#631a1d]"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Step: choose procedure */}
      {step === "procedure" && (
        <div className="space-y-3">
          {active.length === 0 && (
            <p className="text-center text-gray-400 py-12">Nenhum procedimento disponível.</p>
          )}
          {active.map((proc) => (
            <button
              key={proc.id}
              onClick={() => { setSelectedProcedureId(proc.id); setStep("datetime"); }}
              className="w-full text-left bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-[#c4a0a2] hover:shadow transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#fbe8e9] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-[#631a1d]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{proc.name}</p>
                  {proc.duration && <p className="text-sm text-gray-400">{proc.duration} min</p>}
                </div>
                {proc.price && (
                  <span className="text-sm font-semibold text-[#631a1d] flex-shrink-0">
                    {typeof proc.price === "number"
                      ? `R$ ${proc.price.toFixed(2).replace(".", ",")}`
                      : proc.price}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step: choose date + time */}
      {step === "datetime" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <div className="bg-white rounded-2xl shadow-md border border-[#fbe8e9] p-6">
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#fbe8e9] transition-colors text-[#631a1d]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-bold text-[#4f1518] capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#fbe8e9] transition-colors text-[#631a1d]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-2">
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="text-center text-xs font-semibold text-[#9ca3af] py-1">
                    {wd}
                  </div>
                ))}
              </div>

              {/* Day grid */}
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
                          ? "bg-[#631a1d] text-white shadow-md"
                          : isTodayDay
                          ? "bg-[#fbe8e9] text-[#631a1d] font-bold ring-2 ring-[#ebb3b7]"
                          : "text-[#374151] hover:bg-[#fbe8e9] hover:text-[#631a1d]",
                      ].join(" ")}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="bg-white rounded-2xl shadow-md border border-[#fbe8e9] p-6">
                <h3 className="text-base font-bold text-[#4f1518] mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#631a1d]" />
                  Horários disponíveis
                </h3>
                <p className="text-xs text-[#9ca3af] mb-4 capitalize">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {TIME_SLOTS.map((slot) => {
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
                            ? "bg-[#631a1d] text-white border-[#631a1d] shadow-md"
                            : "border-[#fbe8e9] text-[#4f1518] hover:border-[#ebb3b7] hover:bg-[#fbe8e9]",
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

          {/* Sidebar summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md border border-[#fbe8e9] p-6 sticky top-20">
              <h3 className="text-base font-bold text-[#4f1518] mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#631a1d]" />
                Resumo
              </h3>
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-xs text-[#9ca3af] font-medium uppercase tracking-wide">Tratamento</p>
                  <p className="text-sm font-semibold text-[#4f1518] mt-0.5">{procedure?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9ca3af] font-medium uppercase tracking-wide">Data</p>
                  <p className="text-sm font-semibold text-[#4f1518] mt-0.5">
                    {selectedDate
                      ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                      : <span className="text-[#d1d5db] font-normal">Selecione uma data</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#9ca3af] font-medium uppercase tracking-wide">Horário</p>
                  <p className="text-sm font-semibold text-[#4f1518] mt-0.5">
                    {selectedTime ?? <span className="text-[#d1d5db] font-normal">Selecione um horário</span>}
                  </p>
                </div>
                {procedure?.price && (
                  <div className="pt-2 border-t border-[#fbe8e9]">
                    <p className="text-xs text-[#9ca3af] font-medium uppercase tracking-wide">Valor</p>
                    <p className="text-lg font-bold text-[#631a1d] mt-0.5">
                      {typeof procedure.price === "number"
                        ? `R$ ${procedure.price.toFixed(2).replace(".", ",")}`
                        : procedure.price}
                    </p>
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
                    ? "bg-[#631a1d] text-white hover:bg-[#751e22] shadow-md hover:shadow-lg"
                    : "bg-[#f3f4f6] text-[#d1d5db] cursor-not-allowed",
                ].join(" ")}
              >
                Continuar
              </button>

              {(!selectedDate || !selectedTime) && (
                <p className="text-xs text-center text-[#9ca3af] mt-2">
                  {!selectedDate ? "Selecione uma data para continuar" : "Selecione um horário para continuar"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step: confirm */}
      {step === "confirm" && procedure && (
        <div className="max-w-md space-y-6">
          <div className="bg-white border border-[#fbe8e9] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-[#4f1518] text-lg">Resumo do agendamento</h2>
            <div className="space-y-3 text-sm">
              <Row label="Procedimento" value={procedure.name} />
              {procedure.duration && <Row label="Duração" value={`${procedure.duration} min`} />}
              {procedure.price && (
                <Row
                  label="Valor"
                  value={typeof procedure.price === "number"
                    ? `R$ ${procedure.price.toFixed(2).replace(".", ",")}`
                    : procedure.price}
                />
              )}
              {selectedDate && (
                <Row label="Data" value={format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} />
              )}
              {selectedTime && <Row label="Horário" value={selectedTime} />}
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Seu agendamento será confirmado em até 24h por WhatsApp.
          </p>
          <button
            onClick={() => setStep("done")}
            className="w-full bg-[#631a1d] text-white py-3 rounded-xl font-medium hover:bg-[#751e22] transition-colors shadow-lg"
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
      <span className="font-medium text-[#4f1518]">{value}</span>
    </div>
  );
}
