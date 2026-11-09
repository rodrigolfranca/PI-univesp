import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  durationToHeight,
  formatWeekLabel,
  getDaysInMonth,
  getMondayOf,
  getMonthGrid,
  timeToTop,
  toDDMMYYYY,
} from "./calendar";
import {
  displayDateToIso,
  displayStatusFromApi,
  filterAppointments,
  isoToDisplayDate,
} from "./appointment";
import type { Appointment } from "../../config/types";

const appointment = (
  id: number,
  client: string,
  procedure: string,
  status: Appointment["status"],
) => ({ id, client, procedure, status }) as Appointment;

describe("calendário da agenda", () => {
  it("calcula semana, meses, datas e posições", () => {
    const monday = getMondayOf(new Date(2026, 10, 8, 12));
    expect(toDDMMYYYY(monday)).toBe("02/11/2026");
    expect(toDDMMYYYY(addDays(monday, 6))).toBe("08/11/2026");
    expect(toDDMMYYYY(addMonths(monday, 1))).toBe("01/12/2026");
    expect(timeToTop("10:00")).toBeGreaterThan(0);
    expect(durationToHeight(30)).toBeGreaterThan(0);
    expect(formatWeekLabel(monday).toLowerCase()).toContain("novembro");
    expect(formatWeekLabel(new Date(2026, 10, 30)).toLowerCase()).toContain("dezembro");
  });

  it("monta grades do mês", () => {
    const grid = getMonthGrid(new Date(2026, 10, 1));
    expect(grid.length % 7).toBe(0);
    expect(grid.filter(Boolean)).toHaveLength(30);
    expect(grid[0]).toBeNull();

    const days = getDaysInMonth(new Date(2026, 10, 1));
    expect(days.filter((day) => day !== null)).toHaveLength(30);
    expect(days[0]).toBe(1);
  });
});

describe("utilitários de agendamento", () => {
  it("converte datas e status", () => {
    expect(isoToDisplayDate("2026-11-09")).toBe("09/11/2026");
    expect(displayDateToIso("09/11/2026")).toBe("2026-11-09");
    expect(displayStatusFromApi("completed")).toBe("Concluído");
    expect(displayStatusFromApi("canceled")).toBe("Cancelado");
    expect(displayStatusFromApi("absent")).toBe("Ausente");
    expect(displayStatusFromApi("scheduled")).toBe("Confirmado");
  });

  it("filtra por busca e status", () => {
    const items = [
      appointment(1, "Maria Silva", "Limpeza", "Confirmado"),
      appointment(2, "Ana Souza", "Botox", "Concluído"),
    ];
    expect(filterAppointments(items, "maria", "")).toEqual([items[0]]);
    expect(filterAppointments(items, "botox", "Concluído")).toEqual([items[1]]);
    expect(filterAppointments(items, "", "Confirmado")).toEqual([items[0]]);
    expect(filterAppointments(items, "", "")).toHaveLength(2);
  });
});
