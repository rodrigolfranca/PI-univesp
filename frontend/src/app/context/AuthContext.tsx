import { useStorageKey } from "../config/SiteContext";
import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "employee" | "client";

export interface AuthUser {
  phone: string;
  name: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (phone: string) => UserRole | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Número reservado para acesso de gestão/funcionários
const EMPLOYEE_PHONE = "11999999999";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const SESSION_KEY = useStorageKey("auth_user");
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  function login(phone: string): UserRole | null {
    const digits = normalizePhone(phone);
    if (!digits) return null;

    const role: UserRole = digits === EMPLOYEE_PHONE ? "employee" : "client";
    const newUser: AuthUser = {
      phone,
      name: role === "employee" ? "Gestão" : "Cliente",
      role,
    };
    setUser(newUser);

    return role;
  }

  function logout() {
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");

  return ctx;
}
