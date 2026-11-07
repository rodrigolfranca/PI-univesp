import { DAY_START, SLOT_HEIGHT, MONTH_NAMES } from "./constants";
export function getMondayOf(date: Date): Date {
  const monday = new Date(date);
  const daysSinceMonday = monday.getDay() === 0 ? 6 : monday.getDay() - 1;
  monday.setDate(monday.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);

  return monday;
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);

  return result;
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function toDDMMYYYY(date: Date): string {
  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear(),
  ].join("/");
}

export function timeToTop(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  const minutesSinceStart = (hours - DAY_START) * 60 + minutes;

  return (minutesSinceStart / 30) * SLOT_HEIGHT;
}

export function durationToHeight(minutes: number): number {
  return (minutes / 30) * SLOT_HEIGHT - 3;
}

// A agenda mensal começa na segunda-feira e completa a última semana.
export function getMonthGrid(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (Date | null)[] = [];
  for (let i = 0; i < mondayOffset; i++) grid.push(null);
  for (let i = 1; i <= daysInMonth; i++) grid.push(new Date(year, month, i));
  while (grid.length % 7 !== 0) grid.push(null);

  return grid;
}

export function formatWeekLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  if (weekStart.getMonth() === end.getMonth())
    return `${weekStart.getDate()}–${end.getDate()} de ${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}`;

  return `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
}

// O seletor do formulário começa no domingo, sem completar a última semana.
export function getDaysInMonth(date: Date): (number | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return days;
}
