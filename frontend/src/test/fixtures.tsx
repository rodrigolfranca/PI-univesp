import type { ReactNode } from "react";
import { SiteProvider } from "../app/config/SiteContext";
import { normalizeConfig } from "../app/config/schema.mjs";
import type { ApiUser } from "../app/services/users";

export const client: ApiUser = {
  id: 42,
  name: "Maria Silva",
  phone_number: "11912345678",
  email: "maria@example.com",
  phone_number_confirmed: false,
  email_confirmed: false,
  client: { id: 7 },
};
export const professional: ApiUser = {
  ...client,
  id: 51,
  client: undefined,
  professional: { id: 8, is_admin: false },
};
export const admin: ApiUser = { ...professional, professional: { id: 8, is_admin: true } };

export function accessToken(id: number, exp = Math.floor(Date.now() / 1000) + 3600) {
  return `header.${btoa(JSON.stringify({ keyType: "access", id, exp }))}.signature`;
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function SiteWrapper({ children }: { children: ReactNode }) {
  const site = normalizeConfig({ id: "test", domains: [] }, { identity: { name: "Teste" } });
  return <SiteProvider site={site}>{children}</SiteProvider>;
}
