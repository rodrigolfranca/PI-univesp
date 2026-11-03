import { useTerminology, useSite } from "../config/SiteContext";
import { SiteIcon } from "../components/SiteIcon";
import { demoOccupiedSlots } from "../config/agenda";
import { useState } from "react";
import { useParams, useNavigate } from "react-router";
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
import { toast } from "sonner";
import { useProcedures } from "../context/ProceduresContext";
import { useBrand } from "../context/BrandContext";
import { BrandLogo } from "../components/BrandLogo";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AgendarPage() {
  const copy = useTerminology();
  const site = useSite();
  const { agenda } = site;
  const { treatmentId } = useParams<{
    treatmentId: string;
  }>();
  const navigate = useNavigate();
  const { procedures } = useProcedures();
  const { name: clinicName } = useBrand();
  const procedure = procedures.find((p) => String(p.id) === treatmentId);
  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
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

  function handleConfirm() {
    if (!selectedDate || !selectedTime || !procedure) return;

    toast.success(
      `Agendamento confirmado! ${procedure.name} em ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às ${selectedTime}. Em breve você receberá uma confirmação.`,
      { duration: 6000 },
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
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-brand-800 text-xl font-semibold mb-4">
            {copy("Tratamento não encontrado.")}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-brand-700 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <header className="bg-white/95 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-600 transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <BrandLogo size="small" />
            <span className="text-sm font-semibold text-brand-700 hidden sm:block">
              {clinicName}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-md border border-brand-100 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <SiteIcon name={site.catalog.icon} className="w-7 h-7 text-brand-700" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block text-xs font-medium text-brand-600 bg-brand-100 px-2 py-0.5 rounded mb-1">
                {procedure.category}
              </span>
              <h1 className="text-2xl font-bold text-brand-800 leading-tight">{procedure.name}</h1>
              {procedure.description && (
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  {procedure.description}
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-3">
                {procedure.duration && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-brand-600" />
                    {procedure.duration}
                  </div>
                )}
                {procedure.price && (
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                    {procedure.price}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {confirmed /* Confirmation state */ ? (
          <div className="bg-white rounded-2xl shadow-md border border-brand-100 p-10 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-brand-700" />
            </div>
            <h2 className="text-2xl font-bold text-brand-800 mb-2">Agendamento confirmado!</h2>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">{procedure.name}</span>
            </p>
            <p className="text-gray-600 mb-1">
              {selectedDate &&
                format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-gray-600 mb-8">às {selectedTime}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleNewBooking}
                className="px-6 py-3 bg-brand-700 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
              >
                Fazer outro agendamento
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 border-2 border-brand-700 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors font-medium"
              >
                Voltar para Home
              </button>
            </div>
          </div>
        ) : (
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
                    <div key={wd} className="text-center text-xs font-semibold text-gray-400 py-1">
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
                            ? "text-gray-300 cursor-not-allowed"
                            : isSelected
                              ? "bg-brand-700 text-white shadow-md"
                              : isTodayDay
                                ? "bg-brand-100 text-brand-700 font-bold ring-2 ring-brand-300"
                                : "text-gray-700 hover:bg-brand-100 hover:text-brand-700",
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
                  <p className="text-xs text-gray-400 mb-4 capitalize">
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
                              ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
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
                  Resumo do agendamento
                </h3>

                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                      {copy("Tratamento")}
                    </p>
                    <p className="text-sm font-semibold text-brand-800 mt-0.5">{procedure.name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                      Data
                    </p>
                    <p className="text-sm font-semibold text-brand-800 mt-0.5">
                      {selectedDate ? (
                        format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span className="text-gray-300 font-normal">Selecione uma data</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                      Horário
                    </p>
                    <p className="text-sm font-semibold text-brand-800 mt-0.5">
                      {selectedTime ?? (
                        <span className="text-gray-300 font-normal">Selecione um horário</span>
                      )}
                    </p>
                  </div>

                  {procedure.price && (
                    <div className="pt-2 border-t border-brand-100">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                        Valor
                      </p>
                      <p className="text-lg font-bold text-brand-700 mt-0.5">{procedure.price}</p>
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
                      ? "bg-brand-700 text-white hover:bg-brand-600 shadow-md hover:shadow-lg"
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
