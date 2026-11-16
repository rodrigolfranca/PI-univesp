import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoriesPage } from "./CategoriesPage";
import { renderWithSite } from "../../test/harness";

const state = vi.hoisted(() => ({
  categories: [
    { id: 1, name: "Geral" },
    { id: 2, name: "Facial" },
  ],
  procedures: [{ id: 1, name: "Limpeza de Pele", category: "Facial" }],
}));

vi.mock("../context/CategoriesContext", () => ({
  useCategories: () => ({
    categories: state.categories,
    loading: false,
    error: "",
    addCategory: vi.fn(),
    editCategory: vi.fn(),
    deleteCategory: vi.fn(),
  }),
}));

vi.mock("../context/ProceduresContext", () => ({
  useProcedures: () => ({ procedures: state.procedures }),
}));

describe("CategoriesPage", () => {
  it("não exibe ações de editar ou excluir para a categoria Geral", () => {
    renderWithSite(<CategoriesPage />);

    expect(screen.queryByRole("button", { name: "Editar Geral" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Excluir Geral" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Editar Facial" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Excluir Facial" }).length).toBeGreaterThan(0);
  });
});
