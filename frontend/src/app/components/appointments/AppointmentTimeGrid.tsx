import type { Appointment } from "../../config/types";
import { STATUS_STYLE } from "../../utils/appointments/constants";
import { AppointmentActionsMenu } from "./AppointmentActionsMenu";
import { MoreVertical } from "lucide-react";
import { DAY_END, DAY_START, SLOT_HEIGHT, WEEK_DAYS } from "../../utils/appointments/constants";
import { toDDMMYYYY, timeToTop, durationToHeight } from "../../utils/appointments/calendar";
export function AppointmentTimeGrid({
  days,
  filteredAppointments,
  today,
  onCancel,
  onGCal,
  labels,
}: {
  days: Date[];
  filteredAppointments: Appointment[];
  today: string;
  onCancel: (a: Appointment) => void;
  onGCal: (a: Appointment) => void;
  labels?: string[];
}) {
  const hourSlots = Array.from({ length: (DAY_END - DAY_START) * 2 }, (_, i) => {
    const totalMin = i * 30;
    const h = DAY_START + Math.floor(totalMin / 60);
    const m = totalMin % 60;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  });
  const totalHeight = hourSlots.length * SLOT_HEIGHT;
  const cols = days.length;

  return (
    <div className="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      <div
        className="grid sticky top-0 z-10 bg-white border-b border-gray-200"
        style={{ gridTemplateColumns: `52px repeat(${cols}, 1fr)` }}
      >
        <div className="border-r border-gray-200" />
        {days.map((day, i) => {
          const dateStr = toDDMMYYYY(day);
          const isToday = dateStr === today;
          const dow = day.getDay() === 0 ? 6 : day.getDay() - 1;
          const label = labels ? labels[i] : WEEK_DAYS[dow];

          return (
            <div
              key={i}
              className={`py-3 text-center border-r border-gray-100 last:border-r-0 ${isToday ? "bg-brand-50" : ""}`}
            >
              <p className={`text-xs font-medium ${isToday ? "text-brand-600" : "text-gray-500"}`}>
                {label}
              </p>
              <p
                className={`text-lg font-semibold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full ${isToday ? "bg-brand-600 text-white" : "text-gray-900"}`}
              >
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid relative" style={{ gridTemplateColumns: `52px repeat(${cols}, 1fr)` }}>
        <div className="border-r border-gray-200">
          {hourSlots.map((slot, i) => (
            <div
              key={slot}
              className="border-b border-gray-100 flex items-start justify-end pr-2 pt-1"
              style={{ height: SLOT_HEIGHT }}
            >
              {i % 2 === 0 && <span className="text-xs text-gray-400 leading-none">{slot}</span>}
            </div>
          ))}
        </div>

        {days.map((day, colIdx) => {
          const dateStr = toDDMMYYYY(day);
          const isToday = dateStr === today;
          const dayAppts = filteredAppointments.filter((a) => a.date === dateStr);

          return (
            <div
              key={colIdx}
              className={`relative border-r border-gray-100 last:border-r-0 ${isToday ? "bg-brand-50/30" : ""}`}
              style={{ height: totalHeight }}
            >
              {hourSlots.map((_, i) => (
                <div
                  key={i}
                  className={`absolute left-0 right-0 border-b ${i % 2 === 0 ? "border-gray-200" : "border-gray-100"}`}
                  style={{
                    top: i * SLOT_HEIGHT,
                    height: SLOT_HEIGHT,
                  }}
                />
              ))}

              {dayAppts.map((appt) => {
                const topPx = timeToTop(appt.time);
                const heightPx = durationToHeight(appt.durationMin);
                const styles = STATUS_STYLE[appt.status];

                return (
                  <div
                    key={appt.id}
                    className={`absolute left-1 right-1 rounded-md border-l-4 px-1.5 py-1 overflow-hidden cursor-pointer group ${styles.block}`}
                    style={{
                      top: topPx,
                      height: heightPx,
                      minHeight: 20,
                    }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate leading-tight">
                          {appt.client}
                        </p>
                        {heightPx > 30 && (
                          <p className="text-xs truncate opacity-80 leading-tight">
                            {appt.procedure}
                          </p>
                        )}
                        {heightPx > 50 && (
                          <p className="text-xs opacity-70 leading-tight">{appt.time}</p>
                        )}
                      </div>
                      <AppointmentActionsMenu
                        appointment={appt}
                        onCancel={onCancel}
                        onGCal={onGCal}
                        trigger={
                          <button
                            aria-label="Ações do agendamento"
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 transition-all flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        }
                        contentClassName="z-[80]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
