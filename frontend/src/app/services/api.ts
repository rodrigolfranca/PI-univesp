export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
export const API_STORAGE_SCOPE = encodeURIComponent(
  API_BASE_URL === "/api"
    ? import.meta.env.VITE_API_PROXY_TARGET || "http://localhost:3000"
    : API_BASE_URL,
);

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
}

async function apiFetch(path: string, options: RequestOptions = {}): Promise<Response> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const body: BodyInit | undefined =
    options.body === undefined
      ? undefined
      : isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      signal: options.signal,
      headers: {
        Accept: "application/json",
        ...(options.body === undefined || isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError("Não foi possível conectar ao servidor. Tente novamente.", 0);
  }

  return response;
}

async function readError(response: Response): Promise<ApiError> {
  const content = await response.text();
  let data: unknown;
  try {
    data = content ? JSON.parse(content) : null;
  } catch {
    throw new ApiError("O servidor retornou uma resposta inválida.", response.status);
  }

  const message = (data as { message?: unknown } | null)?.message;
  return new ApiError(getApiErrorDescription(message), response.status);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await apiFetch(path, options);

  if (!response.ok) {
    throw await readError(response);
  }

  const content = await response.text();
  let data: unknown;
  try {
    data = content ? JSON.parse(content) : null;
  } catch {
    throw new ApiError("O servidor retornou uma resposta inválida.", response.status);
  }

  return data as T;
}

export async function apiRequestBlob(
  path: string,
  options: RequestOptions = {},
): Promise<{ blob: Blob; filename: string | null }> {
  const response = await apiFetch(path, options);

  if (!response.ok) {
    throw await readError(response);
  }

  const disposition = response.headers.get("Content-Disposition");
  const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
  return { blob: await response.blob(), filename };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

function getApiErrorDescription(message: unknown): string {
  if (Array.isArray(message)) {
    return message.filter((entry) => typeof entry === "string").join("; ");
  }
  if (typeof message === "string") return message;
  return "Não foi possível concluir a operação.";
}
