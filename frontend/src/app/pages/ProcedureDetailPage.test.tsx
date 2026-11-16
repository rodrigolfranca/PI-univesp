import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProcedureDetailPage } from "./ProcedureDetailPage";
import { renderWithSite } from "../../test/harness";
import type { Procedure } from "../config/types";
import type { ApiPop } from "../services/pops";

const state = vi.hoisted(() => ({
  deleteProcedure: vi.fn(),
  editProcedure: vi.fn(),
  listPops: vi.fn(),
  updatePop: vi.fn(),
  procedure: null as Procedure | null,
  pops: [] as ApiPop[],
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { isAdmin: true, professionalId: 1 },
    token: "token",
  }),
}));
vi.mock("../context/CategoriesContext", () => ({
  useCategories: () => ({ categories: [{ id: 1, name: "Facial" }] }),
}));
vi.mock("../context/UsersContext", () => ({
  useUsers: () => ({
    users: [
      { id: 1, name: "Admin QA", professional: { id: 1, is_admin: true } },
      { id: 2, name: "ProfissionalUm", professional: { id: 2, is_admin: false } },
    ],
  }),
}));
vi.mock("../context/ProceduresContext", () => ({
  useProcedures: () => ({
    procedures: state.procedure ? [state.procedure] : [],
    loading: false,
    error: "",
    editProcedure: state.editProcedure,
    deleteProcedure: state.deleteProcedure,
  }),
}));
vi.mock("../services/pops", () => ({
  listPops: state.listPops,
  createPop: vi.fn(),
  updatePop: state.updatePop,
  deletePop: vi.fn(),
  downloadPop: vi.fn(),
}));

const procedure: Procedure = {
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
  professionals: [
    { id: 1, name: "Admin QA" },
    { id: 2, name: "ProfissionalUm" },
  ],
};

const pop: ApiPop = {
  id: 10,
  procedure_id: 1,
  name: "Documento antigo",
  created_at: "2026-01-01T00:00:00.000Z",
};

function renderPage() {
  return renderWithSite(
    <Routes>
      <Route path="/app/procedures/:id" element={<ProcedureDetailPage />} />
    </Routes>,
    { route: "/app/procedures/1" },
  );
}

describe("ProcedureDetailPage", () => {
  beforeEach(() => {
    state.procedure = procedure;
    state.pops = [];
    state.deleteProcedure.mockReset().mockResolvedValue(undefined);
    state.editProcedure.mockReset();
    state.listPops.mockReset().mockResolvedValue([]);
    state.updatePop.mockReset();
  });

  it("exclui o procedimento pela tela de detalhe", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Excluir Procedimento" }));
    await user.click(await screen.findByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(state.deleteProcedure).toHaveBeenCalledWith(1));
  });

  it("edita o nome do POP pelo botão de lápis", async () => {
    state.pops = [pop];
    state.listPops.mockResolvedValue([pop]);
    state.updatePop.mockResolvedValue({ ...pop, name: "Documento novo" });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("Documento antigo")).toBeTruthy();
    await user.click(screen.getByTitle("Editar"));
    expect(screen.getByDisplayValue("Documento antigo")).toBeTruthy();

    const input = screen.getByDisplayValue("Documento antigo");
    await user.clear(input);
    await user.type(input, "Documento novo");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(state.updatePop).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ name: "Documento novo", procedureId: 1 }),
        "token",
      ),
    );
  });
});
