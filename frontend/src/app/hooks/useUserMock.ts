import { useState } from "react";
import { useStorageKey } from "../config/SiteContext";
import { API_STORAGE_SCOPE } from "../services/api";

export interface MockDocument {
  id: string;
  name: string;
}

export interface UserMock {
  status: string;
  lastVisit: string;
  role: string;
  documents: MockDocument[];
}

const DEFAULTS: UserMock = { status: "Ativo", lastVisit: "—", role: "Profissional", documents: [] };

// TODO(integracao): substituir os complementos locais pelos campos e endpoints correspondentes.
// IDs dos dados de exemplo das variantes nunca são associados às contas reais.
export function useUserMock(userId: number) {
  const key = useStorageKey(`user_mock_v1:${API_STORAGE_SCOPE}:${userId}`);
  const [data, setData] = useState<UserMock>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? "null");
      if (!stored) return DEFAULTS;
      return {
        status: typeof stored.status === "string" ? stored.status : DEFAULTS.status,
        lastVisit: typeof stored.lastVisit === "string" ? stored.lastVisit : DEFAULTS.lastVisit,
        role: typeof stored.role === "string" ? stored.role : DEFAULTS.role,
        documents: Array.isArray(stored.documents)
          ? stored.documents.filter(
              (doc: MockDocument) => typeof doc?.id === "string" && typeof doc?.name === "string",
            )
          : [],
      };
    } catch {
      return DEFAULTS;
    }
  });

  function save(patch: Partial<UserMock>) {
    const next = { ...data, ...patch };
    localStorage.setItem(key, JSON.stringify(next));
    setData(next);
  }
  return { data, save, clear: () => localStorage.removeItem(key) };
}
