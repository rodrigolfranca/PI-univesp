import { useSite, useStorageKey } from "../config/SiteContext";
import type { Client } from "../config/types";
export type { Client } from "../config/types";
import React, { createContext, useContext, useState } from "react";

interface ClientsContextValue {
  clients: Client[];
  addClient: (client: Omit<Client, "id">) => void;
  editClient: (id: number, patch: Partial<Omit<Client, "id">>) => void;
  deleteClient: (id: number) => void;
}

const ClientsContext = createContext<ClientsContextValue>({
  clients: [],
  addClient: () => {},
  editClient: () => {},
  deleteClient: () => {},
});

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const site = useSite();
  const STORAGE_KEY = useStorageKey("clients_data");
  const initialClients = site.data.clients;
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
    const newId =
      clients.length > 0 ? Math.max(...clients.map((c) => c.id)) + 1 : 1;
    save([...clients, { id: newId, ...data }]);
  }

  function editClient(id: number, patch: Partial<Omit<Client, "id">>) {
    save(clients.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function deleteClient(id: number) {
    save(clients.filter((c) => c.id !== id));
  }

  return (
    <ClientsContext.Provider
      value={{ clients, addClient, editClient, deleteClient }}
    >
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  return useContext(ClientsContext);
}
