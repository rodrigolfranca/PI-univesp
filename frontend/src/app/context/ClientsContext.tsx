import { useUsers } from "./UsersContext";
import type { Client } from "../config/types";

export type { Client } from "../config/types";

// Compatibilidade com a agenda demonstrativa; cadastros vêm exclusivamente da API.
export function useClients() {
  const { users, loading, error } = useUsers();
  const clients: Client[] = users
    .filter((user) => user.client)
    .map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone_number,
      email: user.email,
      // TODO(integracao): usar status e última visita reais quando disponíveis na API.
      status: "Ativo",
      lastVisit: "—",
    }));
  return { clients, loading, error };
}
