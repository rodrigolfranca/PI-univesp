import { apiRequest } from "./api";

export type ContactField = "phone" | "email";

export async function requestContactChange(
  userId: number,
  field: ContactField,
  value: string,
  token: string,
): Promise<void> {
  await apiRequest(`/users/${userId}/contact/request`, {
    method: "POST",
    token,
    body: { field, value },
  });
}

export async function verifyContactChange(
  userId: number,
  field: ContactField,
  value: string,
  code: string,
  token: string,
): Promise<void> {
  await apiRequest(`/users/${userId}/contact/verify`, {
    method: "POST",
    token,
    body: { field, value, code },
  });
}
