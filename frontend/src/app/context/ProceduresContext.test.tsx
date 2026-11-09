import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProceduresProvider, useProcedures } from "./ProceduresContext";
import * as service from "../services/procedures";

const auth = vi.hoisted(() => ({ token: "token" as string | null }));
const categories = vi.hoisted(() => [{ id: 1, name: "Geral" }]);

vi.mock("./AuthContext", () => ({
  useAuth: () => ({ token: auth.token }),
}));
vi.mock("./CategoriesContext", () => ({
  useCategories: () => ({ categories }),
}));
vi.mock("../services/procedures", () => ({
  listProcedures: vi.fn(),
  createProcedure: vi.fn(),
  updateProcedure: vi.fn(),
  deleteProcedure: vi.fn(),
}));

const mocked = vi.mocked(service);
const apiProcedure = {
  id: 1,
  name: "Limpeza",
  description: "Pele",
  duration_minutes: 30,
  price: 100,
  sessions: 1,
  triagem: false,
  triagem_minutes: 0,
  bloqueio_periodo: null,
  category_id: 1,
  status: "active" as const,
  category: { id: 1, name: "Geral" },
};
const form = {
  name: " Limpeza ",
  category: "Geral",
  status: "Ativo",
  description: " Pele ",
  durationMinutes: 30,
  priceValue: 100,
  sessions: 1,
  triagem: false,
  triagemMinutes: 0,
  bloqueioPeriodo: null,
};

function wrapper({ children }: { children: ReactNode }) {
  return <ProceduresProvider>{children}</ProceduresProvider>;
}

describe("ProceduresContext", () => {
  beforeEach(() => {
    auth.token = "token";
    vi.clearAllMocks();
  });

  it("mapeia procedimentos e executa CRUD", async () => {
    mocked.listProcedures.mockResolvedValue([apiProcedure]);
    mocked.createProcedure.mockResolvedValue({ ...apiProcedure, id: 2, name: "Novo" });
    mocked.updateProcedure.mockResolvedValue({ ...apiProcedure, name: "Editado" });
    mocked.deleteProcedure.mockResolvedValue();

    const { result, rerender } = renderHook(() => useProcedures(), { wrapper });
    await waitFor(() => expect(result.current.procedures).toHaveLength(1));
    expect(result.current.procedures[0]).toMatchObject({
      name: "Limpeza",
      category: "Geral",
      duration: "30 min",
      price: "R$ 100,00",
      status: "Ativo",
    });

    await act(async () => {
      await result.current.addProcedure(form);
    });
    expect(mocked.createProcedure).toHaveBeenCalledWith(
      expect.objectContaining({
        category_id: 1,
        name: "Limpeza",
        description: "Pele",
        status: "active",
      }),
      "token",
    );
    expect(result.current.procedures).toHaveLength(2);

    await act(async () => {
      await result.current.editProcedure(1, { ...form, name: "Editado" });
    });
    expect(result.current.procedures.find((entry) => entry.id === 1)?.name).toBe("Editado");

    await act(async () => {
      await result.current.deleteProcedure(2);
    });
    expect(result.current.procedures).toHaveLength(1);
  });

  it("valida categoria, token e erro de listagem", async () => {
    mocked.listProcedures.mockRejectedValue(new Error("Falha"));
    const { result, rerender } = renderHook(() => useProcedures(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe("Falha"));

    await expect(result.current.addProcedure({ ...form, category: "Inexistente" })).rejects.toThrow(
      "Selecione uma categoria válida.",
    );

    auth.token = null;
    rerender();
    await expect(result.current.deleteProcedure(1)).rejects.toThrow(
      "Entre na sua conta para continuar.",
    );
  });
});
