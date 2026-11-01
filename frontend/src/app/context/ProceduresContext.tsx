import React, { createContext, useContext, useState } from "react";

export type Procedure = {
  id: number;
  name: string;
  category: string;
  duration: string;
  price: string;
  status: string;
  description: string;
};

const initialProcedures: Procedure[] = [
  {
    id: 1,
    name: "Limpeza de Pele",
    duration: "60 min",
    price: "R$ 150,00",
    category: "Facial",
    status: "Ativo",
    description: "Tratamento profundo para remoção de impurezas, desobstrução dos poros e renovação da pele.",
  },
  {
    id: 2,
    name: "Drenagem Linfática",
    duration: "90 min",
    price: "R$ 200,00",
    category: "Corporal",
    status: "Ativo",
    description: "Técnica manual para reduzir inchaço, melhorar a circulação e desintoxicar o organismo.",
  },
  {
    id: 3,
    name: "Peeling Químico",
    duration: "45 min",
    price: "R$ 250,00",
    category: "Facial",
    status: "Ativo",
    description: "Esfoliação química para renovação celular, uniformização do tom e pele mais jovem e luminosa.",
  },
  {
    id: 4,
    name: "Massagem Relaxante",
    duration: "60 min",
    price: "R$ 180,00",
    category: "Corporal",
    status: "Ativo",
    description: "Alívio de tensões musculares e promoção do bem-estar profundo com toque especializado.",
  },
  {
    id: 5,
    name: "Depilação a Laser",
    duration: "30 min",
    price: "R$ 300,00",
    category: "Depilação",
    status: "Ativo",
    description: "Remoção definitiva de pelos com tecnologia a laser, segura e eficaz para todos os fototipos.",
  },
  {
    id: 6,
    name: "Microagulhamento",
    duration: "75 min",
    price: "R$ 350,00",
    category: "Facial",
    status: "Inativo",
    description: "Estimulação da produção de colágeno com microagulhas para rejuvenescimento e firmeza da pele.",
  },
];

const STORAGE_KEY = "procedures_data";

interface ProceduresContextValue {
  procedures: Procedure[];
  addProcedure: (p: Omit<Procedure, "id">) => void;
  editProcedure: (id: number, patch: Partial<Omit<Procedure, "id">>) => void;
  deleteProcedure: (id: number) => void;
}

const ProceduresContext = createContext<ProceduresContextValue>({
  procedures: initialProcedures,
  addProcedure: () => {},
  editProcedure: () => {},
  deleteProcedure: () => {},
});

export function ProceduresProvider({ children }: { children: React.ReactNode }) {
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
    const newId = procedures.length > 0 ? Math.max(...procedures.map((p) => p.id)) + 1 : 1;
    save([...procedures, { id: newId, ...data }]);
  }

  function editProcedure(id: number, patch: Partial<Omit<Procedure, "id">>) {
    save(procedures.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function deleteProcedure(id: number) {
    save(procedures.filter((p) => p.id !== id));
  }

  return (
    <ProceduresContext.Provider value={{ procedures, addProcedure, editProcedure, deleteProcedure }}>
      {children}
    </ProceduresContext.Provider>
  );
}

export function useProcedures() {
  return useContext(ProceduresContext);
}
