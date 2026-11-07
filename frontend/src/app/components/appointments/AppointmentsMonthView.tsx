import type { Appointment } from "../../config/types";
import { STATUS_STYLE, WEEK_DAYS } from "../../utils/appointments/constants";
import { getMonthGrid, toDDMMYYYY } from "../../utils/appointments/calendar";
export function AppointmentsMonthView({
  date,
  appointments: filteredAppointments,
  today,
  onDayClick: handleMonthDayClick,
}: {
  date: Date;
  appointments: Appointment[];
  today: string;
  onDayClick: (date: Date) => void;
}) {
  const monthViewDate = date;
  const monthGrid = getMonthGrid(date);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100 last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7" style={{ gridAutoRows: "minmax(90px, 1fr)" }}>
        {monthGrid.map((cell, i) => {
          if (!cell) {
            return (
              <div
                key={i}
                className="border-r border-b border-gray-100 last:border-r-0 bg-gray-50/50"
              />
            );
          }

          const dateStr = toDDMMYYYY(cell);
          const isToday = dateStr === today;
          const isOtherMonth = cell.getMonth() !== monthViewDate.getMonth();
          const dayAppts = filteredAppointments.filter((a) => a.date === dateStr);
          const visible = dayAppts.slice(0, 3);
          const overflow = dayAppts.length - visible.length;

          return (
            <div
              key={i}
              onClick={() => handleMonthDayClick(cell)}
              className={`border-r border-b border-gray-100 last:border-r-0 p-1.5 cursor-pointer transition-colors hover:bg-brand-50/40 flex flex-col gap-0.5 ${isOtherMonth ? "opacity-40" : ""}`}
            >
              <div className="flex items-center justify-end mb-0.5">
                <span
                  className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-brand-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {cell.getDate()}
                </span>
              </div>

              {visible.map((appt) => (
                <div
                  key={appt.id}
                  onClick={(e) => e.stopPropagation()}
                  className={`px-1.5 py-0.5 rounded text-xs font-medium truncate leading-tight ${STATUS_STYLE[appt.status].chip}`}
                  title={`${appt.time} — ${appt.client}: ${appt.procedure}`}
                >
                  {appt.time} {appt.client}
                </div>
              ))}

              {overflow > 0 && (
                <div className="text-xs text-gray-400 font-medium pl-1">+{overflow} mais</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
