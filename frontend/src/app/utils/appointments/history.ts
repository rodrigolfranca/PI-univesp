import type { ApiSchedule } from "../../services/schedules";

export function sortSchedulesNewestFirst(schedules: ApiSchedule[]): ApiSchedule[] {
  return [...schedules].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    return byDate !== 0 ? byDate : b.start_time.localeCompare(a.start_time);
  });
}
