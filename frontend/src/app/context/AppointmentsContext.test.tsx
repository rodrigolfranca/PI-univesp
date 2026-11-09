import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppointmentsProvider, useAppointments } from "./AppointmentsContext";
import * as service from "../services/schedules";
import type { ApiSchedule } from "../services/schedules";

const procedures = vi.hoisted(() => [
  {
    id: 1,
    name: "Limpeza",
    durationMinutes: 30,
    status: "Ativo",
  },
]);
const auth = vi.hoisted(() => ({
  token: "token" as string | null,
  user: {
    userId: 1,
    name: "Admin",
    phone: "",
    email: "",
    role: "employee" as "employee" | "client",
    isAdmin: true,
    clientId: undefined as number | undefined,
    professionalId: 8,
  },
}));

vi.mock("./AuthContext", () => ({
  useAuth: () => ({ token: auth.token, user: auth.user }),
}));
vi.mock("./ProceduresContext", () => ({
  useProcedures: () => ({ procedures }),
}));
vi.mock("../services/schedules", () => ({
  listSchedules: vi.fn(),
  createSchedule: vi.fn(),
  cancelSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
  updateSchedule: vi.fn(),
}));

const mocked = vi.mocked(service);
const schedule: ApiSchedule = {
  id: 10,
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
  client: { id: 7, name: "Maria", phone_number: "11999999999" },
  professional: { id: 8, name: "Ana", phone_number: "11888888888" },
  procedure: {
    id: 1,
    name: "Limpeza",
    description: "",
    duration_minutes: 30,
    price: 100,
    sessions: 1,
    triagem: false,
    triagem_minutes: 0,
    bloqueio_periodo: null,
    category_id: 1,
    status: "active",
  },
};

function wrapper({ children }: { children: ReactNode }) {
  return <AppointmentsProvider>{children}</AppointmentsProvider>;
}

describe("AppointmentsContext", () => {
  beforeEach(() => {
    auth.token = "token";
    auth.user = {
      ...auth.user,
      role: "employee",
      isAdmin: true,
      clientId: undefined,
    };
    vi.clearAllMocks();
  });

  it("mapeia agendamentos e executa ações", async () => {
    mocked.listSchedules.mockResolvedValue([schedule]);
    mocked.createSchedule.mockResolvedValue(schedule);
    mocked.cancelSchedule.mockResolvedValue();
    mocked.deleteSchedule.mockResolvedValue();
    mocked.updateSchedule.mockResolvedValue({ message: "ok" });

    const { result } = renderHook(() => useAppointments(), { wrapper });
    await waitFor(() => expect(result.current.appointments).toHaveLength(1));
    expect(result.current.appointments[0]).toMatchObject({
      client: "Maria",
      professional: "Ana",
      procedure: "Limpeza",
      date: "05/01/2026",
      time: "09:00",
      status: "Confirmado",
      durationMin: 30,
    });

    await act(async () => {
      await result.current.addAppointment({
        clientId: 7,
        professionalId: 8,
        procedureId: 1,
        date: "05/01/2026",
        time: "10:00",
        session: 1,
      });
    });
    expect(mocked.createSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 7,
        professional_id: 8,
        procedure_id: 1,
        date: "2026-01-05",
        start_time: "10:00",
      }),
      "token",
    );

    await act(async () => {
      await result.current.cancelAppointment(10);
      await result.current.deleteAppointment(10);
      await result.current.setAppointmentStatus(10, "completed");
    });
    expect(mocked.cancelSchedule).toHaveBeenCalledWith(10, "token");
    expect(mocked.deleteSchedule).toHaveBeenCalledWith(10, "token");
    expect(mocked.updateSchedule).toHaveBeenCalledWith(10, { status: "completed" }, "token");
  });

  it("filtra por cliente e trata ausência de sessão", async () => {
    auth.user = {
      ...auth.user,
      role: "client",
      isAdmin: false,
      clientId: 7,
      professionalId: undefined,
    };
    mocked.listSchedules.mockResolvedValue([schedule]);
    const first = renderHook(() => useAppointments(), { wrapper });
    await waitFor(() => expect(first.result.current.appointments).toHaveLength(1));
    expect(mocked.listSchedules).toHaveBeenCalledWith(
      "token",
      { client_id: 7 },
      expect.any(AbortSignal),
    );

    auth.token = null;
    const second = renderHook(() => useAppointments(), { wrapper });
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.appointments).toEqual([]);
    await expect(
      second.result.current.addAppointment({
        clientId: 7,
        professionalId: 8,
        procedureId: 1,
        date: "05/01/2026",
        time: "10:00",
        session: 1,
      }),
    ).rejects.toThrow("Entre na sua conta para continuar.");
  });

  it("expõe erro de carregamento", async () => {
    mocked.listSchedules.mockRejectedValue(new Error("Falha na agenda"));
    const { result } = renderHook(() => useAppointments(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe("Falha na agenda"));
    expect(result.current.loading).toBe(false);
  });
});
