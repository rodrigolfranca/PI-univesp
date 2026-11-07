import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { errorMessage } from "../services/api";
import * as usersService from "../services/users";
import type { ApiUser, UserFields, UserKind } from "../services/users";

interface UsersContextValue {
  users: ApiUser[];
  loading: boolean;
  error: string;
  reload: () => void;
  create: (kind: UserKind, fields: UserFields) => Promise<ApiUser>;
  update: (id: number, fields: UserFields) => Promise<ApiUser>;
  remove: (id: number) => Promise<void>;
}

const UsersContext = createContext<UsersContextValue | null>(null);

// A chave desmonta o estado anterior ao trocar de conta ou encerrar a sessão.
export function UsersProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  return (
    <SessionUsersProvider key={`${user?.userId ?? "anonymous"}:${token ?? ""}`}>
      {children}
    </SessionUsersProvider>
  );
}

function SessionUsersProvider({ children }: { children: ReactNode }) {
  const { user, token, syncUser, logout } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(Boolean(user?.isAdmin));
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const canList = Boolean(user?.isAdmin && token);

  useEffect(() => {
    if (!canList || !token) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    usersService
      .listAllUsers(token, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setUsers(result);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [canList, token, revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  function requireToken() {
    if (!token) throw new Error("Entre na sua conta para continuar.");
    return token;
  }

  function replaceUser(updated: ApiUser) {
    setUsers((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
  }

  async function create(kind: UserKind, fields: UserFields) {
    const created = await usersService.createUser(kind, fields, requireToken());
    setUsers((current) => [...current, created]);
    return created;
  }

  async function update(id: number, fields: UserFields) {
    const updated = await usersService.updateUser(id, fields, requireToken());
    replaceUser(updated);
    if (id === user?.userId) syncUser(updated);
    return updated;
  }

  async function remove(id: number) {
    await usersService.deleteUser(id, requireToken());
    setUsers((current) => current.filter((entry) => entry.id !== id));
    if (id === user?.userId) logout();
  }

  return (
    <UsersContext.Provider value={{ users, loading, error, reload, create, update, remove }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) throw new Error("useUsers deve ser usado dentro de UsersProvider");
  return context;
}
