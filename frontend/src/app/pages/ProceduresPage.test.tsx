import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProceduresPage } from "./ProceduresPage";
import { renderWithSite } from "../../test/harness";
import type { Procedure } from "../config/types";

const actions = vi.hoisted(() => ({
  addProcedure: vi.fn(),
  editProcedure: vi.fn(),
  setProcedureStatus: vi.fn(),
  deleteProcedure: vi.fn(),
}));

const state = vi.hoisted(() => ({
  user: {
    isAdmin: true,
    professionalId: 1 as number | undefined,
  },
  categories: [{ id: 1, name: "Facial" }],
  users: [
    { id: 1, name: "Admin QA", professional: { id: 1, is_admin: true } },
    { id: 2, name: "ProfissionalUm", professional: { id: 2, is_admin: false } },
    { id: 3, name: "ProfissionalDois", professional: { id: 3, is_admin: false } },
  ],
  procedures: [] as Procedure[],
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: state.user }),
}));
vi.mock("../context/CategoriesContext", () => ({
  useCategories: () => ({ categories: state.categories }),
}));
vi.mock("../context/UsersContext", () => ({
  useUsers: () => ({ users: state.users }),
}));
vi.mock("../context/ProceduresContext", () => ({
  useProcedures: () => ({
    procedures: state.procedures,
    loading: false,
    error: "",
    ...actions,
  }),
}));

const baseProcedure: Procedure = {
  id: 1,
  name: "Limpeza de Pele",
  category: "Facial",
  duration: "60 min",
  price: "R$ 150,00",
  status: "Ativo",
  description: "Limpeza profunda",
  durationMinutes: 60,
  sessions: 1,
  triagem: false,
  triagemMinutes: 0,
  bloqueioPeriodo: null,
  professionals: [{ id: 1, name: "Admin QA" }],
};

describe("ProceduresPage", () => {
  beforeEach(() => {
    actions.addProcedure.mockReset();
    actions.editProcedure.mockReset();
    actions.setProcedureStatus.mockReset();
    actions.deleteProcedure.mockReset();
    state.user = { isAdmin: true, professionalId: 1 };
    state.procedures = [
      baseProcedure,
      {
        ...baseProcedure,
        id: 2,
        name: "Peeling Químico",
        professionals: [{ id: 2, name: "ProfissionalUm" }],
      },
    ];
  });

  it("filtra procedimentos por profissional para o admin", async () => {
    const user = userEvent.setup();
    renderWithSite(<ProceduresPage />);

    expect(screen.getByText("Limpeza de Pele")).toBeTruthy();
    expect(screen.getByText("Peeling Químico")).toBeTruthy();
    expect(screen.getByText("Admin QA")).toBeTruthy();
    expect(screen.getByText("ProfissionalUm")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await user.click(screen.getByRole("button", { name: "ProfissionalUm" }));

    expect(screen.getByText("Peeling Químico")).toBeTruthy();
    expect(screen.queryByText("Limpeza de Pele")).toBeNull();
  });

  it("mostra a ação conforme o status e alterna sem abrir os detalhes", async () => {
    const user = userEvent.setup();
    actions.setProcedureStatus.mockResolvedValue({ ...baseProcedure, status: "Inativo" });
    renderWithSite(
      <Routes>
        <Route path="/" element={<ProceduresPage />} />
        <Route path="/app/procedures/:id" element={<p>Detalhes do procedimento</p>} />
      </Routes>,
    );

    const toggle = screen.getByRole("switch", { name: "Desativar Limpeza de Pele" });
    const label = document.querySelector(`label[for="${toggle.id}"]`);
    expect(toggle.closest("a")).toBeNull();
    expect(label?.textContent).toBe("Desativar");

    await user.click(toggle);

    await waitFor(() => expect(actions.setProcedureStatus).toHaveBeenCalledWith(1, false));
    expect(screen.queryByText("Detalhes do procedimento")).toBeNull();
    expect(actions.editProcedure).not.toHaveBeenCalled();
  });

  it("mostra Ativar quando o procedimento está inativo", () => {
    state.procedures = [{ ...baseProcedure, status: "Inativo" }];
    renderWithSite(<ProceduresPage />);

    const toggle = screen.getByRole("switch", { name: "Ativar Limpeza de Pele" });
    const label = document.querySelector(`label[for="${toggle.id}"]`);
    expect(label?.textContent).toBe("Ativar");
  });

  it("mantém outro switch habilitado enquanto um status está salvando", async () => {
    let resolveStatus: ((value: Procedure) => void) | undefined;
    actions.setProcedureStatus.mockImplementation(
      () =>
        new Promise<Procedure>((resolve) => {
          resolveStatus = resolve;
        }),
    );
    const user = userEvent.setup();
    renderWithSite(<ProceduresPage />);

    const first = screen.getByRole("switch", { name: "Desativar Limpeza de Pele" });
    const second = screen.getByRole("switch", { name: "Desativar Peeling Químico" });

    await user.click(first);

    expect(first.hasAttribute("disabled")).toBe(true);
    expect(second.hasAttribute("disabled")).toBe(false);
    expect(document.querySelector(`label[for="${first.id}"]`)?.textContent).toBe("Desativando...");

    await act(async () => {
      resolveStatus?.({ ...baseProcedure, status: "Inativo" });
    });
    await waitFor(() => expect(first.hasAttribute("disabled")).toBe(false));
  });

  it("abre novo procedimento sem profissional selecionado e exige ao menos um", async () => {
    const user = userEvent.setup();
    renderWithSite(<ProceduresPage />);

    await user.click(screen.getByRole("button", { name: "Novo procedimento" }));

    expect(screen.getByRole("button", { name: "Admin QA" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(
      screen.getByRole("button", { name: "ProfissionalUm" }).getAttribute("aria-pressed"),
    ).toBe("false");
    expect(
      screen.getByRole("button", { name: "ProfissionalDois" }).getAttribute("aria-pressed"),
    ).toBe("false");

    await user.click(screen.getByRole("button", { name: "Salvar Serviço" }));
    expect(screen.getByText("Selecione pelo menos um profissional")).toBeTruthy();
  });

  it("mostra ao profissional somente os procedimentos habilitados", () => {
    state.user = { isAdmin: false, professionalId: 2 };
    renderWithSite(<ProceduresPage />);

    expect(screen.getByText("Peeling Químico")).toBeTruthy();
    expect(screen.getByText("ProfissionalUm")).toBeTruthy();
    expect(screen.queryByText("Limpeza de Pele")).toBeNull();
    expect(screen.queryByRole("button", { name: "Filtros" })).toBeTruthy();
    expect(screen.queryByRole("switch")).toBeNull();
  });
});
