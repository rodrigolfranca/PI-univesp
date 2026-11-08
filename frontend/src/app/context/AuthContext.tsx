import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useStorageKey } from "../config/SiteContext";
import { API_STORAGE_SCOPE, ApiError, errorMessage } from "../services/api";
import { readAccessToken, verifyLoginCode } from "../services/auth";
import { getUser } from "../services/users";
import type { ApiUser } from "../services/users";

export type UserRole = "employee" | "client";

export interface AuthUser {
  userId: number;
  clientId?: number;
  professionalId?: number;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
}

export function toAuthUser(user: ApiUser): AuthUser {
  if (!user.client && !user.professional) throw new ApiError("Conta sem perfil de acesso.", 401);
  return {
    userId: user.id,
    clientId: user.client?.id,
    professionalId: user.professional?.id,
    name: user.name,
    phone: user.phone_number,
    email: user.email,
    role: user.professional ? "employee" : "client",
    isAdmin: user.professional?.is_admin === true,
  };
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string;
  login: (phone: string, code: string) => Promise<AuthUser>;
  logout: () => void;
  syncUser: (profile: ApiUser) => void;
  retrySession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionKey = useStorageKey(`auth_session_v1:${API_STORAGE_SCOPE}`);
  const legacyKey = useStorageKey("auth_user");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);

  const logout = useCallback(() => {
    generation.current += 1;
    sessionStorage.removeItem(sessionKey);
    setUser(null);
    setToken(null);
    setError("");
    setLoading(false);
  }, [sessionKey]);

  useEffect(() => {
    const controller = new AbortController();
    const version = ++generation.current;
    sessionStorage.removeItem(legacyKey);
    setLoading(true);
    setError("");
    setUser(null);
    setToken(null);

    async function restore() {
      const stored = sessionStorage.getItem(sessionKey);
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const { id } = readAccessToken(stored);
        const profile = toAuthUser(await getUser(id, stored, controller.signal));
        if (generation.current !== version) return;
        setToken(stored);
        setUser(profile);
      } catch (cause) {
        if (controller.signal.aborted || generation.current !== version) return;
        if (cause instanceof ApiError && (cause.status === 401 || cause.status === 404)) {
          logout();
        } else {
          setError(errorMessage(cause));
        }
      } finally {
        if (generation.current === version) setLoading(false);
      }
    }
    void restore();
    return () => controller.abort();
  }, [sessionKey, legacyKey, attempt, logout]);

  useEffect(() => {
    if (!token) return;
    let timeout: ReturnType<typeof setTimeout>;
    function checkExpiry() {
      clearTimeout(timeout);
      try {
        const remaining = readAccessToken(token!).exp * 1000 - Date.now();
        timeout = setTimeout(checkExpiry, Math.min(remaining, 2_147_483_647));
      } catch {
        logout();
      }
    }
    checkExpiry();
    window.addEventListener("focus", checkExpiry);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("focus", checkExpiry);
    };
  }, [token, logout]);

  async function login(phone: string, code: string): Promise<AuthUser> {
    const version = ++generation.current;
    setLoading(false);
    const accessToken = await verifyLoginCode(phone, code);
    const { id } = readAccessToken(accessToken);
    const profile = toAuthUser(await getUser(id, accessToken));
    if (generation.current !== version) throw new Error("Login interrompido. Tente novamente.");
    sessionStorage.setItem(sessionKey, accessToken);
    setToken(accessToken);
    setUser(profile);
    setError("");
    setLoading(false);
    return profile;
  }

  function syncUser(profile: ApiUser) {
    // Uma edição que terminou após logout não pode recriar a sessão.
    setUser((current) => (current?.userId === profile.id ? toAuthUser(profile) : current));
  }

  function retrySession() {
    setAttempt((value) => value + 1);
  }

  const contextValue: AuthContextValue = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    syncUser,
    retrySession,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
