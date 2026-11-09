import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClienteAgendamentosPage } from "./ClienteAgendamentosPage";
import { renderWithSite } from "../../../test/harness";

const state = vi.hoisted(() => ({
  user: { name: "Maria", phone: "11999999999" },
  appointments: [] as {
    id: number;
    procedure: string;
    date: string;
    time: string;
    status: "Confirmado" | "Concluído" | "Cancelado" | "Ausente";
  }[],
  loading: false,
  error: "",
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: state.user }),
}));
vi.mock("../../context/AppointmentsContext", () => ({
  useAppointments: () => ({
    appointments: state.appointments,
    loading: state.loading,
    error: state.error,
  }),
}));

describe("ClienteAgendamentosPage", () => {
  it("separa próximos e histórico", () => {
    state.appointments = [
      { id: 1, procedure: "Limpeza", date: "20/11/2026", time: "09:00", status: "Confirmado" },
      { id: 2, procedure: "Botox", date: "10/11/2026", time: "10:00", status: "Concluído" },
      { id: 3, procedure: "Massagem", date: "05/11/2026", time: "11:00", status: "Cancelado" },
    ];
    renderWithSite(<ClienteAgendamentosPage />);

    expect(screen.getByRole("heading", { name: "Meus Agendamentos" })).toBeTruthy();
    expect(screen.getByText("Maria · 11999999999")).toBeTruthy();
    expect(screen.getByText("Próximos")).toBeTruthy();
    expect(screen.getByText("Histórico")).toBeTruthy();
    expect(screen.getByText("Limpeza")).toBeTruthy();
    expect(screen.getByText("Botox")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Novo" }).getAttribute("href")).toBe("/cliente/novo");
  });

  it("mostra loading, erro e estado vazio", () => {
    state.appointments = [];
    state.loading = true;
    const first = renderWithSite(<ClienteAgendamentosPage />);
    expect(screen.getByText("Carregando agendamentos...")).toBeTruthy();
    first.unmount();

    state.loading = false;
    state.error = "Falha";
    const second = renderWithSite(<ClienteAgendamentosPage />);
    expect(screen.getByRole("alert").textContent).toContain("Falha");
    second.unmount();

    state.error = "";
    renderWithSite(<ClienteAgendamentosPage />);
    expect(screen.getByText("Nenhum agendamento encontrado.")).toBeTruthy();
  });
});
