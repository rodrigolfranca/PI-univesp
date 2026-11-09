import { afterEach, describe, expect, it, vi } from "vitest";
import { jsonResponse } from "../../test/fixtures";
import {
  cancelSchedule,
  createSchedule,
  createScheduleException,
  createWorkSchedule,
  deleteSchedule,
  deleteScheduleException,
  deleteWorkSchedule,
  getAvailabilityForDate,
  getAvailableSlots,
  listMyClientHistory,
  listMyClients,
  listScheduleExceptions,
  listSchedules,
  listWorkSchedules,
  updateSchedule,
  updateScheduleException,
  updateWorkSchedule,
  type ApiSchedule,
} from "./schedules";

const schedule = (id: number, extra: Partial<ApiSchedule> = {}): ApiSchedule => ({
  id,
  procedure_id: 1,
  professional_id: 8,
  client_id: 7,
  document_id: null,
  date: "2026-01-05",
  start_time: "09:00",
  session: 1,
  status: "scheduled",
  google_event_id: null,
  google_event_link: null,
  ...extra,
});

afterEach(() => vi.unstubAllGlobals());

describe("schedules service", () => {
  it("pagina e filtra agendamentos", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ total: 3, page: 1, limit: 30, data: [schedule(1), schedule(2)] }),
      )
      .mockResolvedValueOnce(jsonResponse({ total: 3, page: 2, limit: 30, data: [schedule(3)] }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await listSchedules("token", {
      professional_id: 8,
      client_id: 7,
      date: "2026-01-05",
      status: "scheduled",
    });

    expect(result.map((item) => item.id)).toEqual([1, 2, 3]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/schedules?page=1&limit=30&professional_id=8&client_id=7&date=2026-01-05&status=scheduled",
    );
    expect(fetchMock.mock.calls[1][0]).toContain("page=2");
  });

  it("consulta disponibilidade e horários livres", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          Ana: [
            {
              professional_id: 8,
              day_of_week: 1,
              start_time: "09:00",
              end_time: "10:00",
              available: true,
            },
            {
              professional_id: 8,
              day_of_week: 1,
              start_time: "10:00",
              end_time: "11:00",
              available: false,
            },
          ],
          Vazia: [
            {
              professional_id: 9,
              day_of_week: 1,
              start_time: "09:00",
              end_time: "10:00",
              available: false,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          Ana: [
            { professional_id: 8, day_of_week: 1, start_time: "10:00", end_time: "11:00" },
            { professional_id: 8, day_of_week: 1, start_time: "09:00", end_time: "10:00" },
            {
              professional_id: 8,
              day_of_week: 1,
              start_time: "11:00",
              end_time: "12:00",
              available: false,
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAvailabilityForDate("token", "2026-01-05")).resolves.toEqual([
      {
        name: "Ana",
        professionalId: 8,
        slots: [
          {
            professional_id: 8,
            day_of_week: 1,
            start_time: "09:00",
            end_time: "10:00",
            available: true,
          },
        ],
      },
    ]);
    await expect(getAvailableSlots("token", 8, "2026-01-05")).resolves.toEqual(["09:00", "10:00"]);
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/api/work-schedules/all?day_of_week=1&date=2026-01-05",
    );
  });

  it("lista clientes e histórico do profissional", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([{ clientId: 7, userId: 42, name: "Maria", phone_number: "11999999999" }]),
      )
      .mockResolvedValueOnce(jsonResponse([schedule(1, { client_id: 7 })]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listMyClients("token")).resolves.toEqual([
      { clientId: 7, userId: 42, name: "Maria", phone_number: "11999999999" },
    ]);
    await expect(listMyClientHistory(7, "token")).resolves.toEqual([schedule(1, { client_id: 7 })]);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/schedules/my-clients",
      "/api/schedules/my-clients/7/history",
    ]);
  });

  it("cria, atualiza, cancela e exclui agendamento", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(schedule(1)))
      .mockResolvedValueOnce(jsonResponse({ message: "ok" }))
      .mockResolvedValueOnce(jsonResponse({ message: "ok" }))
      .mockResolvedValueOnce(jsonResponse({ message: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      procedure_id: 1,
      professional_id: 8,
      client_id: 7,
      date: "2026-01-05",
      start_time: "09:00",
      session: 1,
    };
    await createSchedule(payload, "token");
    await updateSchedule(1, { start_time: "10:00" }, "token");
    await cancelSchedule(1, "token");
    await deleteSchedule(1, "token");

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ["/api/schedules", "POST"],
      ["/api/schedules/1", "PATCH"],
      ["/api/schedules/1", "PATCH"],
      ["/api/schedules/1", "DELETE"],
    ]);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ status: "canceled" });
  });

  it("gerencia horários de trabalho", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ message: "ok" }))
      .mockResolvedValueOnce(jsonResponse({ message: "ok" }))
      .mockResolvedValueOnce(jsonResponse({ message: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    await listWorkSchedules("token");
    await listWorkSchedules("token", 8);
    await createWorkSchedule(
      { professional_id: 8, days_of_week: [1], start_time: "09:00", end_time: "18:00" },
      "token",
    );
    await updateWorkSchedule(1, { start_time: "10:00" }, "token");
    await deleteWorkSchedule(1, "token");

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/work-schedules",
      "/api/work-schedules?professional_id=8",
      "/api/work-schedules",
      "/api/work-schedules/update/1",
      "/api/work-schedules/delete/1",
    ]);
  });

  it("pagina e gerencia exceções de agenda", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          total: 2,
          page: 1,
          limit: 30,
          data: [
            {
              id: 1,
              professional_id: 8,
              date: "2026-01-05",
              type: "blocked",
              start_time: null,
              end_time: null,
              name: "Feriado",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          total: 2,
          page: 2,
          limit: 30,
          data: [
            {
              id: 2,
              professional_id: 8,
              date: "2026-01-06",
              type: "open",
              start_time: "09:00",
              end_time: "10:00",
              name: null,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 3 }))
      .mockResolvedValueOnce(jsonResponse({ message: "ok" }))
      .mockResolvedValueOnce(jsonResponse({ message: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listScheduleExceptions("token", 8)).resolves.toHaveLength(2);
    await createScheduleException(
      { professional_id: 8, date: "2026-01-05", type: "blocked" },
      "token",
    );
    await updateScheduleException(3, { name: "Novo" }, "token");
    await deleteScheduleException(3, "token");

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/schedule-exceptions?professional_id=8&page=1&limit=30",
      "/api/schedule-exceptions?professional_id=8&page=2&limit=30",
      "/api/schedule-exceptions",
      "/api/schedule-exceptions/3",
      "/api/schedule-exceptions/3",
    ]);
  });
});
