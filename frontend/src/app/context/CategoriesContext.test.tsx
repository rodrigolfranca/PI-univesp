import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoriesProvider, useCategories } from "./CategoriesContext";
import * as service from "../services/categories";

const auth = vi.hoisted(() => ({ token: "token" as string | null }));

vi.mock("./AuthContext", () => ({
  useAuth: () => ({ token: auth.token }),
}));
vi.mock("../services/categories", () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

const mocked = vi.mocked(service);

function wrapper({ children }: { children: ReactNode }) {
  return <CategoriesProvider>{children}</CategoriesProvider>;
}

describe("CategoriesContext", () => {
  beforeEach(() => {
    auth.token = "token";
    vi.clearAllMocks();
  });

  it("carrega, cria, edita e exclui categorias", async () => {
    mocked.listCategories.mockResolvedValue([{ id: 1, name: "Geral" }]);
    mocked.createCategory.mockResolvedValue({ id: 2, name: "Nova" });
    mocked.updateCategory.mockResolvedValue({ id: 2, name: "Editada" });
    mocked.deleteCategory.mockResolvedValue();

    const { result, rerender } = renderHook(() => useCategories(), { wrapper });
    await waitFor(() => expect(result.current.categories).toHaveLength(1));
    expect(result.current.loading).toBe(false);

    await act(() => result.current.addCategory("Nova"));
    expect(mocked.createCategory).toHaveBeenCalledWith("Nova", "token");
    expect(mocked.listCategories).toHaveBeenCalledTimes(2);

    await act(() => result.current.editCategory(2, "Editada"));
    expect(mocked.updateCategory).toHaveBeenCalledWith(2, "Editada", "token");

    await act(() => result.current.deleteCategory(2));
    expect(mocked.deleteCategory).toHaveBeenCalledWith(2, "token");
  });

  it("expõe erro de listagem e exige token nas mutações", async () => {
    mocked.listCategories.mockRejectedValue(new Error("Falha ao carregar"));
    const { result, rerender } = renderHook(() => useCategories(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe("Falha ao carregar"));

    auth.token = null;
    rerender();
    await expect(result.current.addCategory("Nova")).rejects.toThrow(
      "Entre na sua conta para continuar.",
    );
    expect(mocked.createCategory).not.toHaveBeenCalled();
  });
});
