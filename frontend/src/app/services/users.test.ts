import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiError } from "./api";
import { createUser, deleteUser, getUser, listAllUsers, updateUser, validateUser } from "./users";
import { client, jsonResponse, professional } from "../../test/fixtures";

afterEach(() => vi.unstubAllGlobals());

describe("contrato de usuários", () => {
  it("percorre todas as páginas e mantém distintos os IDs de usuário e de cliente", async () => {
    const firstPage = Array.from({ length: 30 }, (_, index) => ({ ...client, id: index + 1 }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ total: 31, users: firstPage }))
      .mockResolvedValueOnce(jsonResponse({ total: 31, users: [client] }));
    vi.stubGlobal("fetch", fetchMock);
    const users = await listAllUsers("token");
    expect(users).toHaveLength(31);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/users?page=2&limit=30");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer token");
    expect(users.at(-1)).toMatchObject({ id: 42, client: { id: 7 } });
  });

  it("não apresenta listagem parcial quando uma página falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ total: 2, users: [client] }))
        .mockResolvedValueOnce(jsonResponse({ message: "Falha" }, 500)),
    );
    await expect(listAllUsers("token")).rejects.toThrow("Falha");
  });

  it("interrompe uma paginação inconsistente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ total: 2, users: [] })));
    await expect(listAllUsers("token")).rejects.toThrow("listagem foi interrompida");
  });

  it.each(["client", "professional"] as const)(
    "envia apenas os campos aceitos ao cadastrar %s",
    async (kind) => {
      const fetchMock = vi.fn().mockResolvedValue(
        jsonResponse({
          user: client,
          [kind]: { id: 7, ...(kind === "professional" ? { is_admin: false } : {}) },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);
      const fields = {
        name: " Maria Silva ",
        phone: "(11) 91234-5678",
        email: " maria@example.com ",
        status: "Inativo",
        documents: ["exemplo"],
      };
      const result = await createUser(kind, fields);
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
        name: "Maria Silva",
        phone_number: "11912345678",
        email: "maria@example.com",
        phone_number_confirmed: false,
        ...(kind === "professional" ? { is_admin: false } : {}),
      });
      expect(result[kind]?.id).toBe(7);
    },
  );

  it("consulta novamente após PATCH para preservar os vínculos", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ...professional, professional: undefined }))
      .mockResolvedValueOnce(jsonResponse(professional));
    vi.stubGlobal("fetch", fetchMock);
    const result = await updateUser(
      51,
      { name: "Maria Silva", phone: "11912345678", email: "maria@example.com" },
      "token",
    );
    expect(fetchMock.mock.calls.map(([url, init]) => [url, init.method])).toEqual([
      ["/api/users/51", "PATCH"],
      ["/api/users/51", "GET"],
    ]);
    expect(result.professional?.id).toBe(8);
  });

  it("trata o retorno null como usuário inexistente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(null)));
    await expect(getUser(42, "token")).rejects.toMatchObject({ status: 404 });
  });

  it("exclui pelo ID de usuário e propaga erros sem fallback", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: "Sem permissão" }, 401));
    vi.stubGlobal("fetch", fetchMock);
    await expect(deleteUser(42, "token")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/users/42");
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
  });

  it("exibe mensagens de validação da API", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ message: ["Nome inválido", "Telefone inválido"] }, 400)),
    );
    await expect(apiRequest("/users")).rejects.toThrow("Nome inválido; Telefone inválido");
  });

  it("distingue falha de conexão de resposta inválida", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(apiRequest("/users")).rejects.toMatchObject({ status: 0 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>SPA</html>")));
    await expect(apiRequest("/users")).rejects.toThrow("resposta inválida");
  });

  it("preserva cancelamentos sem convertê-los em erros de rede", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Cancelado", "AbortError")));
    await expect(apiRequest("/users", { signal: controller.signal })).rejects.not.toBeInstanceOf(
      ApiError,
    );
  });

  it("valida os limites do cadastro e normaliza a máscara do telefone", () => {
    expect(
      validateUser({ name: "Maria D'Ávila", phone: "(11) 91234-5678", email: "maria@example.com" }),
    ).toEqual({});
    expect(Object.keys(validateUser({ name: "M1", phone: "123", email: "inválido" }))).toEqual([
      "name",
      "phone",
      "email",
    ]);
  });
});
