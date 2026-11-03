import { useSite, useStorageKey } from "../config/SiteContext";
import type { Procedure } from "../config/types";
export type { Procedure } from "../config/types";
import React, { createContext, useContext, useState } from "react";

interface ProceduresContextValue {
  procedures: Procedure[];
  addProcedure: (p: Omit<Procedure, "id">) => void;
  editProcedure: (id: number, patch: Partial<Omit<Procedure, "id">>) => void;
  deleteProcedure: (id: number) => void;
}

const ProceduresContext = createContext<ProceduresContextValue>({
  procedures: [],
  addProcedure: () => {},
  editProcedure: () => {},
  deleteProcedure: () => {},
});

export function ProceduresProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = useSite();
  const STORAGE_KEY = useStorageKey("procedures_data");
  const initialProcedures = site.catalog.procedures;
  const [procedures, setProcedures] = useState<Procedure[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : initialProcedures;
    } catch {
      return initialProcedures;
    }
  });

  function save(next: Procedure[]) {
    setProcedures(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addProcedure(data: Omit<Procedure, "id">) {
    const newId =
      procedures.length > 0 ? Math.max(...procedures.map((p) => p.id)) + 1 : 1;
    save([...procedures, { id: newId, ...data }]);
  }

  function editProcedure(id: number, patch: Partial<Omit<Procedure, "id">>) {
    save(procedures.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function deleteProcedure(id: number) {
    save(procedures.filter((p) => p.id !== id));
  }

  return (
    <ProceduresContext.Provider
      value={{ procedures, addProcedure, editProcedure, deleteProcedure }}
    >
      {children}
    </ProceduresContext.Provider>
  );
}

export function useProcedures() {
  return useContext(ProceduresContext);
}
