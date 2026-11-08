import { useUsers } from "./UsersContext";
import type { Client } from "../config/types";

export type { Client } from "../config/types";

export function useClients() {
  const { users, loading, error } = useUsers();
  const clients: Client[] = users
    .filter((user) => user.client)
    .map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone_number,
      email: user.email,
    }));
  return { clients, loading, error };
}
