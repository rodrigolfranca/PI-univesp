import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTH_NAMES } from "../../utils/appointments/constants";
import { getDaysInMonth, toDDMMYYYY } from "../../utils/appointments/calendar";
export function AppointmentDatePicker({
  month: calendarMonth,
  onMonthChange: setCalendarMonth,
  selectedDate,
  onSelect: setSelectedDate,
  today,
}: {
  month: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: string | null;
  onSelect: (date: string) => void;
  today: string;
}) {
  const handleDayClick = (day: number) =>
    setSelectedDate(
      toDDMMYYYY(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)),
    );
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <button
          aria-label="Mês anterior"
          onClick={() =>
            setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))
          }
          className="p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
        </span>
        <button
          aria-label="Próximo mês"
          onClick={() =>
            setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))
          }
          className="p-1.5 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className="text-center text-xs text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {getDaysInMonth(calendarMonth).map((day, i) => {
          if (!day) return <div key={i} />;

          const ds = toDDMMYYYY(
            new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day),
          );
          const isSel = selectedDate === ds;
          const isT = ds === today;

          return (
            <button
              key={i}
              onClick={() => handleDayClick(day)}
              className={`aspect-square text-sm font-medium rounded-lg transition-colors ${isSel ? "bg-brand-600 text-white" : isT ? "bg-brand-100 text-brand-700 hover:bg-brand-200" : "hover:bg-gray-100 text-gray-700"}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
