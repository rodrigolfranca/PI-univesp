import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClienteNovoAgendamentoPage } from "./ClienteNovoAgendamentoPage";
import { renderWithSite } from "../../../test/harness";
import * as service from "../../services/schedules";

const state = vi.hoisted(() => ({
  token: "token" as string | null,
  reload: vi.fn(),
  procedures: [
    {
      id: 1,
      name: "Limpeza",
      category: "Geral",
      duration: "30 min",
      price: "R$ 100,00",
      status: "Ativo",
      description: "",
      durationMinutes: 30,
      sessions: 1,
      triagem: false,
      triagemMinutes: 0,
      bloqueioPeriodo: null,
    },
  ],
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { clientId: 7, name: "Maria" },
    token: state.token,
  }),
}));
vi.mock("../../context/ProceduresContext", () => ({
  useProcedures: () => ({ procedures: state.procedures }),
}));
vi.mock("../../context/AppointmentsContext", () => ({
  useAppointments: () => ({ reload: state.reload }),
}));
vi.mock("../../services/schedules", () => ({
  getAvailabilityForDate: vi.fn(),
  createSchedule: vi.fn(),
}));

const mocked = vi.mocked(service);

describe("ClienteNovoAgendamentoPage", () => {
  beforeEach(() => {
    state.token = "token";
    state.reload.mockReset();
    mocked.getAvailabilityForDate.mockReset();
    mocked.createSchedule.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 10, 8, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("escolhe procedimento, data, horário e confirma", async () => {
    mocked.getAvailabilityForDate.mockResolvedValue([
      {
        name: "Ana",
        professionalId: 8,
        slots: [
          {
            professional_id: 8,
            day_of_week: 5,
            start_time: "09:00",
            end_time: "09:30",
            available: true,
          },
        ],
      },
    ]);
    mocked.createSchedule.mockResolvedValue({
      id: 1,
      procedure_id: 1,
      professional_id: 8,
      client_id: 7,
      document_id: null,
      date: "2026-11-20",
      start_time: "09:00",
      session: 1,
      status: "scheduled",
      google_event_id: null,
      google_event_link: null,
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithSite(<ClienteNovoAgendamentoPage />, {
      route: "/cliente/novo?treatmentId=1",
    });

    expect(screen.getByText("Escolha data e horário")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "20" }));
    expect(await screen.findByText("09:00")).toBeTruthy();
    expect(mocked.getAvailabilityForDate).toHaveBeenCalledWith(
      "token",
      "2026-11-20",
      expect.any(AbortSignal),
    );

    await user.click(screen.getByRole("button", { name: "09:00" }));
    expect(screen.getByRole("heading", { name: "Confirmar agendamento" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Confirmar agendamento" }));

    await waitFor(() => expect(mocked.createSchedule).toHaveBeenCalled());
    expect(mocked.createSchedule).toHaveBeenCalledWith(
      {
        client_id: 7,
        professional_id: 8,
        procedure_id: 1,
        date: "2026-11-20",
        start_time: "09:00",
        session: 1,
      },
      "token",
    );
    expect(state.reload).toHaveBeenCalled();
    expect(await screen.findByText("Agendado!")).toBeTruthy();
  });

  it("começa pela lista quando não há treatmentId", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithSite(<ClienteNovoAgendamentoPage />, { route: "/cliente/novo" });

    expect(screen.getByText(/Escolha o serviço/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Limpeza/ }));
    expect(screen.getByText("Escolha data e horário")).toBeTruthy();
  });

  it("exibe erro sem cliente autenticado ao escolher data", async () => {
    state.token = null;
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithSite(<ClienteNovoAgendamentoPage />, {
      route: "/cliente/novo?treatmentId=1",
    });

    await user.click(screen.getByRole("button", { name: "20" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Entre com uma conta de cliente para agendar.",
    );
    expect(mocked.getAvailabilityForDate).not.toHaveBeenCalled();
  });
});
