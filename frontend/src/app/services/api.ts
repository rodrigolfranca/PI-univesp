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
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      signal: options.signal,
      headers: {
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError("Não foi possível conectar ao servidor. Tente novamente.", 0);
  }

  const content = await response.text();
  let data: unknown;
  try {
    data = content ? JSON.parse(content) : null;
  } catch {
    throw new ApiError("O servidor retornou uma resposta inválida.", response.status);
  }

  if (!response.ok) {
    const message = (data as { message?: unknown } | null)?.message;
    const description = getApiErrorDescription(message);
    throw new ApiError(description, response.status);
  }

  return data as T;
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
