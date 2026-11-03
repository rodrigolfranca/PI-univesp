import { ApiError, apiRequest } from "./api";
import { normalizePhone } from "./users";

export function readAccessToken(token: string): { id: number; exp: number } {
  try {
    const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(encoded));
    if (
      payload.keyType !== "access" ||
      !Number.isSafeInteger(payload.id) ||
      payload.id < 1 ||
      !Number.isFinite(payload.exp) ||
      payload.exp * 1000 <= Date.now()
    )
      throw new Error();
    return { id: payload.id, exp: payload.exp };
  } catch {
    throw new ApiError("Sua sessão expirou. Entre novamente.", 401);
  }
}

export async function requestLoginCode(phone: string): Promise<void> {
  await apiRequest("/auth/request-code", {
    method: "POST",
    body: { phone_number: normalizePhone(phone) },
  });
}

export async function verifyLoginCode(phone: string, code: string): Promise<string> {
  const result = await apiRequest<{ access_token: string }>("/auth/verify-code", {
    method: "POST",
    body: { phone_number: normalizePhone(phone), verification_code: code },
  });
  return result.access_token;
}
