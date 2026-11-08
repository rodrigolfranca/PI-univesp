import { ApiError, apiRequest } from "./api";

export interface ApiProcedure {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  sessions: number;
  triagem: boolean;
  triagem_minutes: number;
  bloqueio_periodo: number | null;
  category_id: number;
  category?: { id: number; name: string };
}

export interface ProcedurePayload {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  sessions: number;
  triagem: boolean;
  triagem_minutes: number;
  bloqueio_periodo: number | null;
  category_id: number;
}

export async function listProcedures(signal?: AbortSignal): Promise<ApiProcedure[]> {
  return await apiRequest<ApiProcedure[]>("/procedures", { signal });
}

export async function getProcedure(id: number, signal?: AbortSignal): Promise<ApiProcedure> {
  try {
    return await apiRequest<ApiProcedure>(`/procedures/${id}`, { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError("Procedimento não encontrado.", 404);
    }
    throw error;
  }
}

export async function createProcedure(
  payload: ProcedurePayload,
  token: string,
): Promise<ApiProcedure> {
  return await apiRequest<ApiProcedure>("/procedures", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function updateProcedure(
  id: number,
  payload: Partial<ProcedurePayload>,
  token: string,
): Promise<ApiProcedure> {
  return await apiRequest<ApiProcedure>(`/procedures/${id}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export async function deleteProcedure(id: number, token: string): Promise<void> {
  await apiRequest(`/procedures/${id}`, { method: "DELETE", token });
}
