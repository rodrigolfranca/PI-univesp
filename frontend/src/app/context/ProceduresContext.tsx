import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useCategories } from "./CategoriesContext";
import { errorMessage } from "../services/api";
import * as proceduresService from "../services/procedures";
import type { ApiProcedure, ProcedurePayload } from "../services/procedures";
import type { Procedure } from "../config/types";

export type { Procedure } from "../config/types";

export interface ProcedureFormData {
  name: string;
  category: string;
  status: string;
  description: string;
  durationMinutes: number;
  priceValue: number;
  sessions: number;
  triagem: boolean;
  triagemMinutes: number;
  bloqueioPeriodo: number | null;
}

interface ProceduresContextValue {
  procedures: Procedure[];
  loading: boolean;
  error: string;
  reload: () => void;
  addProcedure: (data: ProcedureFormData) => Promise<Procedure>;
  editProcedure: (id: number, data: ProcedureFormData) => Promise<Procedure>;
  deleteProcedure: (id: number) => Promise<void>;
}

const ProceduresContext = createContext<ProceduresContextValue | null>(null);

function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function toPayload(data: ProcedureFormData, categoryId: number): ProcedurePayload {
  return {
    category_id: categoryId,
    status: data.status === "Ativo" ? "active" : "inactive",
    name: data.name.trim(),
    description: data.description.trim(),
    duration_minutes: data.durationMinutes,
    price: data.priceValue,
    sessions: data.sessions,
    triagem: data.triagem,
    triagem_minutes: data.triagemMinutes,
    bloqueio_periodo: data.bloqueioPeriodo,
  };
}

export function ProceduresProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { categories } = useCategories();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const mapProcedure = useCallback((procedure: ApiProcedure): Procedure => {
    return {
      id: procedure.id,
      name: procedure.name,
      category: procedure.category?.name ?? "Geral",
      duration: `${procedure.duration_minutes} min`,
      price: formatPrice(procedure.price),
      status: procedure.status === "inactive" ? "Inativo" : "Ativo",
      description: procedure.description,
      durationMinutes: procedure.duration_minutes,
      sessions: procedure.sessions,
      triagem: procedure.triagem,
      triagemMinutes: procedure.triagem_minutes,
      bloqueioPeriodo: procedure.bloqueio_periodo,
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    proceduresService
      .listProcedures(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setProcedures(result.map(mapProcedure));
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [mapProcedure, revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  function requireToken() {
    if (!token) throw new Error("Entre na sua conta para continuar.");
    return token;
  }

  function categoryId(name: string): number {
    const category = categories.find((entry) => entry.name === name);
    if (!category) throw new Error("Selecione uma categoria válida.");
    return category.id;
  }

  async function addProcedure(data: ProcedureFormData): Promise<Procedure> {
    const created = await proceduresService.createProcedure(
      toPayload(data, categoryId(data.category)),
      requireToken(),
    );
    const mapped = mapProcedure(created);
    setProcedures((current) => [...current, mapped]);
    return mapped;
  }

  async function editProcedure(id: number, data: ProcedureFormData): Promise<Procedure> {
    const updated = await proceduresService.updateProcedure(
      id,
      toPayload(data, categoryId(data.category)),
      requireToken(),
    );
    const mapped = mapProcedure(updated);
    setProcedures((current) => current.map((entry) => (entry.id === id ? mapped : entry)));
    return mapped;
  }

  async function deleteProcedure(id: number): Promise<void> {
    await proceduresService.deleteProcedure(id, requireToken());
    setProcedures((current) => current.filter((entry) => entry.id !== id));
  }

  return (
    <ProceduresContext.Provider
      value={{ procedures, loading, error, reload, addProcedure, editProcedure, deleteProcedure }}
    >
      {children}
    </ProceduresContext.Provider>
  );
}

export function useProcedures() {
  const context = useContext(ProceduresContext);
  if (!context) throw new Error("useProcedures deve ser usado dentro de ProceduresProvider");
  return context;
}
