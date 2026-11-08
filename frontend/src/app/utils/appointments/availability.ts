import type { ApiScheduleException, ApiWorkSchedule } from "../../services/schedules";
import { DAY_END, DAY_START } from "./constants";

export interface AvailabilityBand {
  start: number;
  end: number;
  type: "work" | "open" | "blocked";
  label?: string;
}

export type AvailabilityByDate = Record<string, AvailabilityBand[]>;

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function clamp(start: number, end: number): { start: number; end: number } | null {
  const from = Math.max(start, DAY_START * 60);
  const to = Math.min(end, DAY_END * 60);
  return to > from ? { start: from, end: to } : null;
}

export function buildAvailabilityBands(
  date: Date,
  workSchedules: ApiWorkSchedule[],
  exceptions: ApiScheduleException[],
): AvailabilityBand[] {
  const dayOfWeek = date.getDay();
  const bands: AvailabilityBand[] = [];

  for (const schedule of workSchedules) {
    if (schedule.day_of_week !== dayOfWeek) continue;
    const interval = clamp(timeToMinutes(schedule.start_time), timeToMinutes(schedule.end_time));
    if (interval) bands.push({ ...interval, type: "work" });
  }

  for (const exception of exceptions) {
    const exceptionDate = new Date(`${exception.date}T00:00:00`);
    if (exceptionDate.toDateString() !== date.toDateString()) continue;

    const fullDay = !exception.start_time || !exception.end_time;
    const interval = clamp(
      fullDay ? DAY_START * 60 : timeToMinutes(exception.start_time!),
      fullDay ? DAY_END * 60 : timeToMinutes(exception.end_time!),
    );
    if (!interval) continue;

    bands.push({
      ...interval,
      type: exception.type === "blocked" ? "blocked" : "open",
      label: exception.name ?? (exception.type === "blocked" ? "Bloqueio" : "Abertura"),
    });
  }

  return bands;
}
