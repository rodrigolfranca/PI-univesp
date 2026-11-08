import { apiRequest } from "./api";

export interface ApiCategory {
  id: number;
  name: string;
}

export async function listCategories(signal?: AbortSignal): Promise<ApiCategory[]> {
  return await apiRequest<ApiCategory[]>("/categories", { signal });
}

export async function createCategory(name: string, token: string): Promise<ApiCategory> {
  return await apiRequest<ApiCategory>("/categories", {
    method: "POST",
    token,
    body: { name },
  });
}

export async function updateCategory(
  id: number,
  name: string,
  token: string,
): Promise<ApiCategory> {
  return await apiRequest<ApiCategory>(`/categories/${id}`, {
    method: "PATCH",
    token,
    body: { name },
  });
}

export async function deleteCategory(id: number, token: string): Promise<void> {
  await apiRequest(`/categories/${id}`, { method: "DELETE", token });
}
