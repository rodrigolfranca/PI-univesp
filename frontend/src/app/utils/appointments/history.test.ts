import { describe, expect, it } from "vitest";
import { sortSchedulesNewestFirst } from "./history";
import type { ApiSchedule } from "../../services/schedules";

function schedule(id: number, date: string, start_time: string): ApiSchedule {
  return {
    id,
    procedure_id: 1,
    professional_id: 1,
    client_id: 1,
    document_id: null,
    date,
    start_time,
    session: 1,
    status: "scheduled",
    google_event_id: null,
    google_event_link: null,
  };
}

describe("sortSchedulesNewestFirst", () => {
  it("ordena por data e horário decrescentes", () => {
    const result = sortSchedulesNewestFirst([
      schedule(1, "2026-11-09", "09:00"),
      schedule(2, "2026-11-10", "08:00"),
      schedule(3, "2026-11-09", "15:00"),
    ]);
    expect(result.map((entry) => entry.id)).toEqual([2, 3, 1]);
  });
});
