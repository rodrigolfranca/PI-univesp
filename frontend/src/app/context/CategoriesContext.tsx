import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { errorMessage } from "../services/api";
import * as categoriesService from "../services/categories";
import type { Category } from "../config/types";

export type { Category } from "../config/types";

interface CategoriesContextValue {
  categories: Category[];
  loading: boolean;
  error: string;
  reload: () => void;
  addCategory: (name: string) => Promise<void>;
  editCategory: (id: number, name: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    categoriesService
      .listCategories(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setCategories(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  function requireToken() {
    if (!token) throw new Error("Entre na sua conta para continuar.");
    return token;
  }

  async function addCategory(name: string): Promise<void> {
    await categoriesService.createCategory(name, requireToken());
    reload();
  }

  async function editCategory(id: number, name: string): Promise<void> {
    await categoriesService.updateCategory(id, name, requireToken());
    reload();
  }

  async function deleteCategory(id: number): Promise<void> {
    await categoriesService.deleteCategory(id, requireToken());
    reload();
  }

  return (
    <CategoriesContext.Provider
      value={{ categories, loading, error, reload, addCategory, editCategory, deleteCategory }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) throw new Error("useCategories deve ser usado dentro de CategoriesProvider");
  return context;
}
