import { useState } from "react";
import { addDays, addMonths, formatWeekLabel, getMondayOf } from "../utils/appointments/calendar";
import { MONTH_NAMES, WEEK_DAYS_LONG } from "../utils/appointments/constants";

export type ViewMode = "day" | "week" | "month" | "list";

export function useAppointmentNavigation() {
  const [view, setView] = useState<ViewMode>("week");
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
  const [dayDate, setDayDate] = useState(() => new Date());
  const [monthViewDate, setMonthViewDate] = useState(() => new Date());
  const dayOfWeek = dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1;

  function navigate(direction: number) {
    if (view === "day") setDayDate((date) => addDays(date, direction));
    if (view === "week") setWeekStart((date) => addDays(date, direction * 7));
    if (view === "month") setMonthViewDate((date) => addMonths(date, direction));
  }

  function goToToday() {
    if (view === "day") setDayDate(new Date());
    if (view === "week") setWeekStart(getMondayOf(new Date()));
    if (view === "month") setMonthViewDate(new Date());
  }

  function selectDay(date: Date) {
    setDayDate(date);
    setView("day");
  }

  return {
    view,
    setView,
    dayDate,
    monthViewDate,
    weekDays: Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    dayName: WEEK_DAYS_LONG[dayOfWeek],
    label:
      view === "day"
        ? `${WEEK_DAYS_LONG[dayOfWeek]}, ${dayDate.getDate()} de ${MONTH_NAMES[dayDate.getMonth()]} de ${dayDate.getFullYear()}`
        : view === "month"
          ? `${MONTH_NAMES[monthViewDate.getMonth()]} ${monthViewDate.getFullYear()}`
          : formatWeekLabel(weekStart),
    previous: () => navigate(-1),
    next: () => navigate(1),
    goToToday,
    selectDay,
  };
}
