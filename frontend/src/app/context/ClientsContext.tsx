import React, { createContext, useContext, useState } from "react";

export type Client = {
  id: number;
  name: string;
  phone: string;
  email: string;
  lastVisit: string;
  status: string;
};

const initialClients: Client[] = [
  { id: 1, name: "Ana Silva",         phone: "(11) 98765-4321", email: "ana.silva@email.com",         lastVisit: "10/05/2026", status: "Ativo"   },
  { id: 2, name: "Maria Santos",      phone: "(11) 97654-3210", email: "maria.santos@email.com",      lastVisit: "08/05/2026", status: "Ativo"   },
  { id: 3, name: "Juliana Costa",     phone: "(11) 96543-2109", email: "juliana.costa@email.com",     lastVisit: "05/05/2026", status: "Ativo"   },
  { id: 4, name: "Patricia Lima",     phone: "(11) 95432-1098", email: "patricia.lima@email.com",     lastVisit: "02/05/2026", status: "Inativo" },
  { id: 5, name: "Fernanda Oliveira", phone: "(11) 94321-0987", email: "fernanda.oliveira@email.com", lastVisit: "01/05/2026", status: "Ativo"   },
];

const STORAGE_KEY = "clients_data";

interface ClientsContextValue {
  clients: Client[];
  addClient: (client: Omit<Client, "id">) => void;
  editClient: (id: number, patch: Partial<Omit<Client, "id">>) => void;
  deleteClient: (id: number) => void;
}

const ClientsContext = createContext<ClientsContextValue>({
  clients: initialClients,
  addClient: () => {},
  editClient: () => {},
  deleteClient: () => {},
});

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : initialClients;
    } catch {
      return initialClients;
    }
  });

  function save(next: Client[]) {
    setClients(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addClient(data: Omit<Client, "id">) {
    const newId = clients.length > 0 ? Math.max(...clients.map((c) => c.id)) + 1 : 1;
    save([...clients, { id: newId, ...data }]);
  }

  function editClient(id: number, patch: Partial<Omit<Client, "id">>) {
    save(clients.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function deleteClient(id: number) {
    save(clients.filter((c) => c.id !== id));
  }

  return (
    <ClientsContext.Provider value={{ clients, addClient, editClient, deleteClient }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  return useContext(ClientsContext);
}
