import { ApiError, apiRequest } from "./api";

export type UserKind = "client" | "professional";

export interface ApiUser {
  id: number;
  name: string;
  phone_number: string;
  phone_number_confirmed: boolean;
  email: string;
  email_confirmed: boolean;
  client?: { id: number } | null;
  professional?: { id: number; is_admin: boolean } | null;
}

export interface UserFields {
  name: string;
  phone: string;
  email: string;
}

export interface UserPage {
  total: number;
  page: number;
  limit: number;
  users: ApiUser[];
}

interface CreateUserResponse {
  user: ApiUser;
  client?: { id: number };
  professional?: { id: number; is_admin: boolean };
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function userPayload(fields: UserFields) {
  return {
    name: fields.name.trim(),
    phone_number: normalizePhone(fields.phone),
    email: fields.email.trim(),
  };
}

export function validateUser(fields: UserFields): Partial<Record<keyof UserFields, string>> {
  const errors: Partial<Record<keyof UserFields, string>> = {};
  const { name, phone_number, email } = userPayload(fields);
  if (name.length < 3 || name.length > 150 || !/^[a-záéíóúãõâêôàçñ\s\-']+$/i.test(name)) {
    errors.name =
      "Informe um nome de 3 a 150 caracteres, apenas com letras, espaços, hífens e apóstrofos.";
  }
  if (!/^\d{11}$/.test(phone_number)) errors.phone = "Informe o DDD e o telefone com 11 dígitos.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Informe um e-mail válido.";
  return errors;
}

export async function getUser(id: number, token: string, signal?: AbortSignal): Promise<ApiUser> {
  try {
    return await apiRequest<ApiUser>(`/users/${id}`, { token, signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError("Usuário não encontrado.", 404);
    }
    throw error;
  }
}

export async function getUserByPhone(
  phone: string,
  token: string,
  signal?: AbortSignal,
): Promise<ApiUser> {
  try {
    return await apiRequest<ApiUser>(
      `/users/by-phone?phone_number=${encodeURIComponent(normalizePhone(phone))}`,
      { token, signal },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError("Usuário não encontrado.", 404);
    }
    throw error;
  }
}

export async function listAllUsers(token: string, signal?: AbortSignal): Promise<ApiUser[]> {
  const users = new Map<number, ApiUser>();
  let page = 1;
  let received = 0;
  while (true) {
    const result = await apiRequest<UserPage>(`/users?page=${page}&limit=30`, { token, signal });
    result.users.forEach((user) => users.set(user.id, user));
    received += result.users.length;
    if (received >= result.total) return [...users.values()];
    if (!result.users.length)
      throw new ApiError("A listagem foi interrompida. Atualize e tente novamente.", 0);
    page += 1;
  }
}

export async function createUser(
  kind: UserKind,
  fields: UserFields,
  token?: string,
): Promise<ApiUser> {
  const result = await apiRequest<CreateUserResponse>(`/users/${kind}`, {
    method: "POST",
    token,
    body: {
      ...userPayload(fields),
      phone_number_confirmed: false,
      ...(kind === "professional" ? { is_admin: false } : {}),
    },
  });
  return { ...result.user, client: result.client, professional: result.professional };
}

export async function updateUser(id: number, fields: UserFields, token: string): Promise<ApiUser> {
  await apiRequest(`/users/${id}`, { method: "PATCH", token, body: userPayload(fields) });
  // A resposta do PATCH não inclui os vínculos; consultá-los evita perder as permissões.
  return getUser(id, token);
}

export async function deleteUser(id: number, token: string): Promise<void> {
  await apiRequest(`/users/${id}`, { method: "DELETE", token });
}
