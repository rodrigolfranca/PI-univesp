import { apiRequest, apiRequestBlob } from "./api";

export interface ApiPop {
  id: number;
  procedure_id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

interface PopPage {
  total: number;
  page: number;
  limit: number;
  pops: ApiPop[];
}

export interface PopUpload {
  procedureId: number;
  name: string;
  file?: File;
}

export async function listPops(
  procedureId: number,
  token?: string,
  signal?: AbortSignal,
): Promise<ApiPop[]> {
  const pops = new Map<number, ApiPop>();
  let page = 1;
  let received = 0;

  while (true) {
    const params = new URLSearchParams({
      procedure_id: String(procedureId),
      page: String(page),
      limit: "100",
    });
    const result = await apiRequest<PopPage>(`/pops?${params.toString()}`, {
      token,
      signal,
    });
    result.pops.forEach((pop) => pops.set(pop.id, pop));
    received += result.pops.length;
    if (received >= result.total || result.pops.length === 0) return [...pops.values()];
    page += 1;
  }
}

function popFormData(upload: PopUpload): FormData {
  const data = new FormData();
  data.set("procedure_id", String(upload.procedureId));
  data.set("name", upload.name);
  if (upload.file) data.set("file", upload.file);
  return data;
}

export async function createPop(upload: PopUpload, token: string): Promise<ApiPop> {
  if (!upload.file) throw new Error("Selecione um arquivo PDF.");
  return await apiRequest<ApiPop>("/pops", {
    method: "POST",
    token,
    body: popFormData({ ...upload, file: upload.file }),
  });
}

export async function updatePop(id: number, upload: PopUpload, token: string): Promise<ApiPop> {
  return await apiRequest<ApiPop>(`/pops/${id}`, {
    method: "PATCH",
    token,
    body: popFormData(upload),
  });
}

export async function deletePop(id: number, token: string): Promise<void> {
  await apiRequest(`/pops/${id}`, { method: "DELETE", token });
}

export async function downloadPop(
  id: number,
  token?: string,
): Promise<{ blob: Blob; filename: string | null }> {
  return await apiRequestBlob(`/pops/${id}/download`, { token });
}
