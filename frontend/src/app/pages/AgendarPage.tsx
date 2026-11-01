import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Clock, Calendar, Sparkles, CheckCircle } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useProcedures } from "../context/ProceduresContext";
import { useBrand } from "../context/BrandContext";
import defaultLogo from "../../imports/dayane_logo_white_ilustracao_transparente_limpa.png";

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

export function AgendarPage() {
  const { treatmentId } = useParams<{ treatmentId: string }>();
  const navigate = useNavigate();
  const { procedures } = useProcedures();
  const { name: clinicName, logoUrl } = useBrand();
  const logo = logoUrl ?? defaultLogo;

  const procedure = procedures.find((p) => String(p.id) === treatmentId);

  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

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

  function handleConfirm() {
    if (!selectedDate || !selectedTime || !procedure) return;
    toast.success(
      `Agendamento confirmado! ${procedure.name} em ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às ${selectedTime}. Em breve você receberá uma confirmação.`,
      { duration: 6000 }
    );
    setConfirmed(true);
  }

  function handleNewBooking() {
    setSelectedDate(null);
    setSelectedTime(null);
    setConfirmed(false);
  }

  if (!procedure) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wine-50 via-white to-wine-100 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-wine-800 text-xl font-semibold mb-4">Tratamento não encontrado.</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-wine-700 text-white rounded-lg hover:bg-wine-600 transition-colors"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wine-50 via-white to-wine-100">
      {/* Header */}
      <header className="bg-white/95 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-wine-700 hover:text-wine-600 transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-8 h-8 bg-gradient-to-br from-wine-600 to-wine-800 rounded-full p-1.5 shadow">
              <img src={logo} alt={clinicName} className="w-full h-full object-cover rounded-full" />
            </div>
            <span className="text-sm font-semibold text-wine-700 hidden sm:block">{clinicName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Treatment Info */}
        <div className="bg-white rounded-2xl shadow-md border border-wine-100 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-wine-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-7 h-7 text-wine-700" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block text-xs font-medium text-wine-600 bg-wine-100 px-2 py-0.5 rounded mb-1">
                {procedure.category}
              </span>
              <h1 className="text-2xl font-bold text-wine-800 leading-tight">{procedure.name}</h1>
              {procedure.description && (
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{procedure.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-3">
                {procedure.duration && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-wine-600" />
                    {procedure.duration} min
                  </div>
                )}
                {procedure.price && (
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-wine-700">
                    {typeof procedure.price === "number"
                      ? `R$ ${procedure.price.toFixed(2).replace(".", ",")}`
                      : procedure.price}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {confirmed ? (
          /* Confirmation state */
          <div className="bg-white rounded-2xl shadow-md border border-wine-100 p-10 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-wine-700" />
            </div>
            <h2 className="text-2xl font-bold text-wine-800 mb-2">Agendamento confirmado!</h2>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">{procedure.name}</span>
            </p>
            <p className="text-gray-600 mb-1">
              {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-gray-600 mb-8">às {selectedTime}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleNewBooking}
                className="px-6 py-3 bg-wine-700 text-white rounded-lg hover:bg-wine-600 transition-colors font-medium"
              >
                Fazer outro agendamento
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 border-2 border-wine-700 text-wine-700 rounded-lg hover:bg-wine-100 transition-colors font-medium"
              >
                Voltar para Home
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar + Time slots */}
            <div className="lg:col-span-2 space-y-6">
              {/* Calendar */}
              <div className="bg-white rounded-2xl shadow-md border border-wine-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-wine-100 transition-colors text-wine-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-base font-bold text-wine-800 capitalize">
                    {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                  </h2>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-wine-100 transition-colors text-wine-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                  {WEEKDAYS.map((wd) => (
                    <div key={wd} className="text-center text-xs font-semibold text-gray-400 py-1">
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
                    const isSelected =
                      selectedDate?.toDateString() === day.toDateString();
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
                            ? "text-gray-300 cursor-not-allowed"
                            : isSelected
                            ? "bg-wine-700 text-white shadow-md"
                            : isTodayDay
                            ? "bg-wine-100 text-wine-700 font-bold ring-2 ring-wine-300"
                            : "text-gray-700 hover:bg-wine-100 hover:text-wine-700",
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
                <div className="bg-white rounded-2xl shadow-md border border-wine-100 p-6">
                  <h3 className="text-base font-bold text-wine-800 mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-wine-700" />
                    Horários disponíveis
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 capitalize">
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
                              ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                              : isChosen
                              ? "bg-wine-700 text-white border-wine-700 shadow-md"
                              : "border-wine-100 text-wine-800 hover:border-wine-300 hover:bg-wine-100",
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

            {/* Booking summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-md border border-wine-100 p-6 sticky top-20">
                <h3 className="text-base font-bold text-wine-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-wine-700" />
                  Resumo do agendamento
                </h3>

                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Tratamento</p>
                    <p className="text-sm font-semibold text-wine-800 mt-0.5">{procedure.name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Data</p>
                    <p className="text-sm font-semibold text-wine-800 mt-0.5">
                      {selectedDate
                        ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                        : <span className="text-gray-300 font-normal">Selecione uma data</span>}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Horário</p>
                    <p className="text-sm font-semibold text-wine-800 mt-0.5">
                      {selectedTime ?? <span className="text-gray-300 font-normal">Selecione um horário</span>}
                    </p>
                  </div>

                  {procedure.price && (
                    <div className="pt-2 border-t border-wine-100">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Valor</p>
                      <p className="text-lg font-bold text-wine-700 mt-0.5">
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
                  onClick={handleConfirm}
                  className={[
                    "w-full py-3 rounded-lg font-medium transition-all text-sm",
                    selectedDate && selectedTime
                      ? "bg-wine-700 text-white hover:bg-wine-600 shadow-md hover:shadow-lg"
                      : "bg-gray-100 text-gray-300 cursor-not-allowed",
                  ].join(" ")}
                >
                  Confirmar agendamento
                </button>

                {(!selectedDate || !selectedTime) && (
                  <p className="text-xs text-center text-gray-400 mt-2">
                    {!selectedDate
                      ? "Selecione uma data para continuar"
                      : "Selecione um horário para continuar"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
