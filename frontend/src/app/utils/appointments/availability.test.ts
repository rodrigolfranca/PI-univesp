import { describe, expect, it } from "vitest";
import { buildAvailabilityBands } from "./availability";
import type { ApiScheduleException, ApiWorkSchedule } from "../../services/schedules";

const workSchedule: ApiWorkSchedule = {
  id: 1,
  professional_id: 10,
  day_of_week: 1,
  start_time: "09:00",
  end_time: "18:00",
};

describe("buildAvailabilityBands", () => {
  it("combina horário de trabalho, bloqueio e abertura", () => {
    const date = new Date(2026, 10, 9);
    const exceptions: ApiScheduleException[] = [
      {
        id: 1,
        professional_id: 10,
        date: "2026-11-09",
        type: "blocked",
        start_time: "10:00",
        end_time: "11:00",
        name: "Reunião",
      },
      {
        id: 2,
        professional_id: 10,
        date: "2026-11-09",
        type: "open",
        start_time: "17:00",
        end_time: "18:00",
        name: "Horário extra",
      },
    ];

    expect(buildAvailabilityBands(date, [workSchedule], exceptions)).toEqual([
      { start: 540, end: 1080, type: "work" },
      { start: 600, end: 660, type: "blocked", label: "Reunião" },
      { start: 1020, end: 1080, type: "open", label: "Horário extra" },
    ]);
  });

  it("trata exceção de dia inteiro", () => {
    const date = new Date(2026, 10, 9);
    const exceptions: ApiScheduleException[] = [
      {
        id: 3,
        professional_id: 10,
        date: "2026-11-09",
        type: "blocked",
        start_time: null,
        end_time: null,
        name: "Feriado",
      },
    ];

    expect(buildAvailabilityBands(date, [workSchedule], exceptions)).toEqual([
      { start: 540, end: 1080, type: "work" },
      { start: 540, end: 1080, type: "blocked", label: "Feriado" },
    ]);
  });
});
