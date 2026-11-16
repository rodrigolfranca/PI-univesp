import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { BrandProvider } from "../context/BrandContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { UsersProvider } from "../context/UsersContext";
import { API_STORAGE_SCOPE } from "../services/api";
import { LoginPage } from "../pages/LoginPage";
import { SignupPage } from "../pages/SignupPage";
import { UserDirectory } from "./UserDirectory";
import { UserDetails } from "./UserDetails";
import { UserProfile } from "./UserProfile";
import {
  accessToken,
  admin,
  client,
  jsonResponse,
  professional,
  SiteWrapper,
} from "../../test/fixtures";
import type { ApiUser } from "../services/users";

vi.mock("../services/site", () => ({
  getSiteBrand: vi.fn(async () => null),
  updateSiteBrand: vi.fn(async (brand: unknown) => brand),
  uploadBrandLogo: vi.fn(),
  listGalleryImages: vi.fn(async () => []),
  uploadGalleryImage: vi.fn(),
  updateGalleryImageTitle: vi.fn(),
  deleteGalleryImage: vi.fn(),
}));

afterEach(() => vi.unstubAllGlobals());

function Location() {
  const location = useLocation();
  const { user, logout } = useAuth();
  return (
    <>
      <p data-testid="location">
        {location.pathname}
        {location.search}
      </p>
      <p data-testid="account">{user?.userId ?? "anonymous"}</p>
      <button onClick={logout}>Encerrar sessão</button>
    </>
  );
}

function renderFlow(path: string) {
  return render(
    <SiteWrapper>
      <AuthProvider>
        <BrandProvider>
          <MemoryRouter initialEntries={[path]}>
            <UsersProvider>
              <Location />
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/app/clients" element={<UserDirectory kind="client" />} />
                <Route path="/app/employees" element={<UserDirectory kind="professional" />} />
                <Route path="/app/clients/42" element={<UserDetails id={42} kind="client" />} />
                <Route path="/app/clients/404" element={<UserDetails id={404} kind="client" />} />
                <Route
                  path="/app/employees/51"
                  element={<UserDetails id={51} kind="professional" />}
                />
                <Route path="/perfil" element={<UserProfile />} />
                <Route path="*" element={<p>Destino</p>} />
              </Routes>
            </UsersProvider>
          </MemoryRouter>
        </BrandProvider>
      </AuthProvider>
    </SiteWrapper>,
  );
}

function restoreAs(user: ApiUser) {
  sessionStorage.setItem(`test:auth_session_v1:${API_STORAGE_SCOPE}`, accessToken(user.id));
}

async function fillUser(name = "Ana Souza", phone = "11987654321", email = "ana@example.com") {
  const input = userEvent.setup();
  for (const [label, value] of [
    ["Nome completo", name],
    ["Telefone com DDD", phone],
    ["E-mail", email],
  ]) {
    const field = screen.getByLabelText(label) as HTMLInputElement;
    if (field.readOnly || field.disabled) continue;
    await input.clear(field);
    await input.type(field, value);
  }
  return input;
}

describe("fluxos de entrada", () => {
  it("não autentica com código inválido e preserva o destino de tratamento ao tentar novamente", async () => {
    const token = accessToken(client.id);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: "Gerado", expires_in: 300, resend_after: 90 }))
      .mockResolvedValueOnce(jsonResponse({ message: "Invalid or expired verification code" }, 401))
      .mockResolvedValueOnce(jsonResponse({ access_token: token }))
      .mockResolvedValueOnce(jsonResponse(client));
    vi.stubGlobal("fetch", fetchMock);
    renderFlow("/login?treatmentId=15");
    const input = userEvent.setup();
    expect(screen.getByRole("button", { name: "Recuperar conta" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cadastre-se" })).toBeTruthy();
    await input.type(screen.getByLabelText("Telefone"), "(11) 91234-5678");
    await input.click(screen.getByRole("button", { name: "Solicitar código" }));
    expect(screen.queryByRole("button", { name: "Recuperar conta" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Cadastre-se" })).toBeNull();
    await input.type(await screen.findByLabelText("Código de verificação"), "000000");
    await input.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByTestId("account").textContent).toBe("anonymous");
    await input.clear(screen.getByLabelText("Código de verificação"));
    await input.type(screen.getByLabelText("Código de verificação"), "123456");
    await input.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe("/agendar/15"));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ phone_number: "11912345678" });
  });

  it("recupera a conta em etapas: e-mail, código, novo telefone e código", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ recovery_id: "recovery-1", expires_in: 300, resend_after: 90 }),
      )
      .mockResolvedValueOnce(jsonResponse({ message: "E-mail confirmado" }))
      .mockResolvedValueOnce(jsonResponse({ expires_in: 300, resend_after: 90 }))
      .mockResolvedValueOnce(jsonResponse({ message: "Telefone atualizado" }));
    vi.stubGlobal("fetch", fetchMock);
    renderFlow("/login");
    const input = userEvent.setup();
    await input.click(screen.getByRole("button", { name: "Recuperar conta" }));
    await input.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await input.click(screen.getByRole("button", { name: "Enviar código" }));
    await input.type(await screen.findByLabelText("Código do e-mail"), "111111");
    await input.click(screen.getByRole("button", { name: "Confirmar código" }));
    await input.type(await screen.findByLabelText("Novo telefone"), "(11) 91234-5678");
    await input.click(screen.getByRole("button", { name: "Enviar código" }));
    await input.type(await screen.findByLabelText("Código do novo telefone"), "222222");
    await input.click(screen.getByRole("button", { name: "Confirmar novo telefone" }));

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        "Telefone atualizado. Solicite um novo código para entrar.",
      ),
    );
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({
      recovery_id: "recovery-1",
      email_code: "111111",
    });
    expect(JSON.parse(fetchMock.mock.calls[3][1].body as string)).toEqual({
      recovery_id: "recovery-1",
      phone_number: "11912345678",
      phone_code: "222222",
    });
  });

  it("não inicia código quando o telefone não está cadastrado e oferece cadastro", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ message: "Telefone não cadastrado" }, 404));
    vi.stubGlobal("fetch", fetchMock);
    renderFlow("/login?treatmentId=15");
    const input = userEvent.setup();
    await input.type(screen.getByLabelText("Telefone"), "(11) 91234-5678");
    await input.click(screen.getByRole("button", { name: "Solicitar código" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Telefone não cadastrado");
    expect(screen.getByRole("link", { name: "Fazer cadastro" }).getAttribute("href")).toBe(
      "/signup?treatmentId=15",
    );
    expect(screen.queryByLabelText("Código de verificação")).toBeNull();
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.getByTestId("account").textContent).toBe("anonymous");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      phone_number: "11912345678",
    });
  });

  it("permite corrigir o e-mail e reenviar na mesma tela", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ message: "Não encontramos uma conta com este e-mail" }, 404),
      )
      .mockResolvedValueOnce(
        jsonResponse({ recovery_id: "recovery-1", expires_in: 300, resend_after: 90 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    renderFlow("/login");
    const input = userEvent.setup();
    await input.click(screen.getByRole("button", { name: "Recuperar conta" }));
    await input.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await input.click(screen.getByRole("button", { name: "Enviar código" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Não encontramos uma conta com este e-mail",
    );
    expect(screen.queryByRole("button", { name: "Tentar outro e-mail" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Voltar ao login" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Fazer cadastro" })).toBeNull();
    expect(screen.queryByLabelText("Código do e-mail")).toBeNull();
    expect(screen.queryByRole("timer")).toBeNull();
    expect((screen.getByLabelText("E-mail") as HTMLInputElement).readOnly).toBe(false);

    await input.clear(screen.getByLabelText("E-mail"));
    await input.type(screen.getByLabelText("E-mail"), "outra@example.com");
    await input.click(screen.getByRole("button", { name: "Enviar código" }));

    expect(await screen.findByLabelText("Código do e-mail")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("voltar no topo da recuperação retorna ao login", async () => {
    vi.stubGlobal("fetch", vi.fn());
    renderFlow("/login");
    const input = userEvent.setup();
    await input.click(screen.getByRole("button", { name: "Recuperar conta" }));
    expect(screen.getByRole("heading", { name: "Recuperar conta" })).toBeTruthy();

    await input.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByRole("heading", { name: "Entre na sua conta" })).toBeTruthy();
  });

  it("confirma cadastro somente depois dos códigos de telefone e e-mail", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ signup_id: "signup-1", expires_in: 300, resend_after: 90 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ signup_id: "signup-1", expires_in: 300, resend_after: 90 }),
      )
      .mockResolvedValueOnce(jsonResponse({ message: "Cadastro confirmado" }));
    vi.stubGlobal("fetch", fetchMock);
    renderFlow("/signup?treatmentId=15");
    const input = await fillUser();
    await input.click(screen.getByRole("button", { name: "Cadastrar" }));

    await input.type(await screen.findByLabelText("Código do e-mail"), "111111");
    await input.click(screen.getByRole("button", { name: "Confirmar código" }));
    await input.type(await screen.findByLabelText("Código do telefone"), "222222");
    await input.click(screen.getByRole("button", { name: "Confirmar cadastro" }));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/login?treatmentId=15"),
    );
    expect((screen.getByLabelText("Telefone") as HTMLInputElement).value).toBe("11987654321");
    expect(screen.getByTestId("account").textContent).toBe("anonymous");
    expect(sessionStorage.length).toBe(0);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/auth/signup/request-code",
      "/api/auth/signup/verify-email-code",
      "/api/auth/signup/verify-phone-code",
    ]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      name: "Ana Souza",
      phone_number: "11987654321",
      email: "ana@example.com",
    });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({
      signup_id: "signup-1",
      email_code: "111111",
    });
    expect(JSON.parse(fetchMock.mock.calls[2][1].body as string)).toEqual({
      signup_id: "signup-1",
      phone_code: "222222",
    });
  });

  it("cadastro real encaminha ao login sem criar sessão e mantém treatmentId", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ signup_id: "signup-1", expires_in: 300, resend_after: 90 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ signup_id: "signup-1", expires_in: 300, resend_after: 90 }),
      )
      .mockResolvedValueOnce(jsonResponse({ message: "Cadastro confirmado" }));
    vi.stubGlobal("fetch", fetchMock);
    renderFlow("/signup?treatmentId=15");
    const input = await fillUser();
    await input.click(screen.getByRole("button", { name: "Cadastrar" }));
    await input.type(await screen.findByLabelText("Código do e-mail"), "111111");
    await input.click(screen.getByRole("button", { name: "Confirmar código" }));
    await input.type(await screen.findByLabelText("Código do telefone"), "222222");
    await input.click(screen.getByRole("button", { name: "Confirmar cadastro" }));
    await waitFor(() =>
      expect(screen.getByTestId("location").textContent).toBe("/login?treatmentId=15"),
    );
    expect(screen.getByTestId("account").textContent).toBe("anonymous");
    expect(sessionStorage.length).toBe(0);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/signup/request-code");
  });

  it.each([
    "Este e-mail já está cadastrado em outra conta.",
    "Este telefone já está cadastrado em outra conta.",
  ])("exibe %s sem encerrar formulário", async (message) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message }, 400)));
    renderFlow("/signup");
    const input = await fillUser();
    await input.click(screen.getByRole("button", { name: "Cadastrar" }));
    expect((await screen.findByRole("alert")).textContent).toContain(message);
    expect(screen.getByTestId("location").textContent).toBe("/signup");
  });

  it("impede envio duplicado enquanto o servidor está processando", async () => {
    let resolve!: (response: Response) => void;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((done) => {
        resolve = done;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderFlow("/signup");
    const input = await fillUser();
    await input.dblClick(screen.getByRole("button", { name: "Cadastrar" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      (screen.getByRole("button", { name: "Salvando..." }) as HTMLButtonElement).disabled,
    ).toBe(true);
    await act(async () => resolve(jsonResponse({ message: "Falha de cadastro" }, 500)));
    expect(await screen.findByText("Falha de cadastro")).toBeTruthy();
  });
});

describe("gestão e perfil", () => {
  it("exclusão com falha preserva a conta e avisa sobre ambos os vínculos", async () => {
    restoreAs(admin);
    const dualUser = { ...client, professional: { id: 9, is_admin: false } };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        if (url.endsWith("/51")) return jsonResponse(admin);
        if (url.includes("page=")) return jsonResponse({ total: 1, users: [dualUser] });
        if (init.method === "DELETE") return jsonResponse({ message: "Falha ao excluir" }, 500);
        return jsonResponse(dualUser);
      }),
    );
    renderFlow("/app/clients/42");
    const input = userEvent.setup();
    await input.click(await screen.findByRole("button", { name: "Excluir conta" }));
    expect(screen.getByText(/exclusão afeta ambos/)).toBeTruthy();
    await input.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    expect(await screen.findByText("Falha ao excluir")).toBeTruthy();
    expect(screen.getByTestId("location").textContent).toBe("/app/clients/42");
    await input.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Maria Silva" })).toBeTruthy();
  });

  it("admin cadastra profissional sem conceder privilégios administrativos", async () => {
    restoreAs(admin);
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      if (url.endsWith("/51")) return jsonResponse(admin);
      if (url.includes("page=")) return jsonResponse({ total: 0, users: [] });
      return jsonResponse({
        user: { ...professional, ...JSON.parse(init.body as string) },
        professional: professional.professional,
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    renderFlow("/app/employees");
    const input = userEvent.setup();
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "Cadastrar profissional" }) as HTMLButtonElement)
          .disabled,
      ).toBe(false),
    );
    await input.click(screen.getByRole("button", { name: "Cadastrar profissional" }));
    expect((screen.getByLabelText("Telefone com DDD") as HTMLInputElement).disabled).toBe(false);
    expect((screen.getByLabelText("E-mail") as HTMLInputElement).disabled).toBe(false);
    await fillUser("Ana Souza");
    await input.click(screen.getByRole("button", { name: "Cadastrar", exact: true }));
    expect(await screen.findByRole("link", { name: "Ver detalhes de Ana Souza" })).toBeTruthy();
    const creation = fetchMock.mock.calls.find(([url]) => url === "/api/users/professional");
    expect(JSON.parse(creation![1].body as string).is_admin).toBe(false);
  });

  it("profissional comum vê apenas os próprios clientes", async () => {
    restoreAs(professional);
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/schedules/my-clients")
        return jsonResponse([
          { clientId: 7, userId: 42, name: "Maria Silva", phone_number: "11912345678" },
        ]);
      return jsonResponse(professional);
    });
    vi.stubGlobal("fetch", fetchMock);
    renderFlow("/app/clients");
    await waitFor(() => expect(screen.getByTestId("account").textContent).toBe("51"));
    expect(await screen.findByText("Maria Silva")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Ver histórico de Maria Silva" }).getAttribute("href"),
    ).toBe("/app/clients/7");
    expect(screen.queryByRole("button", { name: "Cadastrar cliente" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Editar Maria Silva" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Excluir Maria Silva" })).toBeNull();
    expect(fetchMock.mock.calls.some(([url]) => url.startsWith("/api/users?page="))).toBe(false);
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/schedules/my-clients")).toBe(true);
  });

  it("erro de permissão da listagem não encerra a sessão nem apresenta mock", async () => {
    restoreAs(admin);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(admin))
        .mockResolvedValueOnce(jsonResponse({ message: "User is not an admin" }, 401)),
    );
    renderFlow("/app/clients");
    expect(await screen.findByText("User is not an admin")).toBeTruthy();
    expect(screen.getByTestId("account").textContent).toBe("51");
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("admin cadastra, edita e exclui usando o ID de usuário", async () => {
    restoreAs(admin);
    let saved = { ...client };
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      if (url === "/api/users/51") return jsonResponse(admin);
      if (url.startsWith("/api/users?page=")) return jsonResponse({ users: [], total: 0 });
      if (url === "/api/users/client") {
        saved = { ...client, ...JSON.parse(init.body as string) };
        return jsonResponse({ user: saved, client: saved.client });
      }
      if (url === "/api/users/42" && init.method === "PATCH") {
        saved = { ...saved, ...JSON.parse(init.body as string) };
        return jsonResponse({ ...saved, client: undefined });
      }
      if (url === "/api/users/42" && init.method === "DELETE")
        return jsonResponse({ message: "Deleted" });
      if (url === "/api/users/42") return jsonResponse(saved);
      throw new Error(`Unexpected: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    renderFlow("/app/clients");
    const input = userEvent.setup();
    await input.click(await screen.findByRole("button", { name: "Cadastrar cliente" }));
    await fillUser();
    await input.click(screen.getByRole("button", { name: "Cadastrar", exact: true }));
    await input.click(await screen.findByRole("link", { name: "Ver detalhes de Ana Souza" }));
    await input.click(await screen.findByRole("button", { name: "Editar nome" }));
    expect((screen.getByLabelText("Nome completo") as HTMLInputElement).disabled).toBe(false);
    expect((screen.getByLabelText("Telefone com DDD") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("E-mail") as HTMLInputElement).disabled).toBe(true);
    expect(
      screen.getByText(
        "Telefone e e-mail só podem ser alterados pelos botões Alterar telefone/e-mail.",
      ),
    ).toBeTruthy();
    await fillUser("Ana Santos");
    await input.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("heading", { name: "Ana Santos" })).toBeTruthy();
    const patch = fetchMock.mock.calls.find(
      ([url, init]) => url === "/api/users/42" && init.method === "PATCH",
    );
    expect(JSON.parse(patch![1].body as string)).toMatchObject({
      name: "Ana Santos",
      phone_number: "11987654321",
      email: "ana@example.com",
    });
    await input.click(screen.getByRole("button", { name: "Excluir conta" }));
    await input.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    await waitFor(() => expect(screen.getByTestId("location").textContent).toBe("/app/clients"));
    expect(screen.queryByRole("link", { name: "Ver detalhes de Ana Santos" })).toBeNull();
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          url === "/api/users/7" || (init.method === "PATCH" && url !== "/api/users/42"),
      ),
    ).toBe(false);
  });

  it("edita e exclui cliente diretamente na listagem", async () => {
    restoreAs(admin);
    let saved = { ...client };
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      if (url === "/api/users/51") return jsonResponse(admin);
      if (url.startsWith("/api/users?page=")) return jsonResponse({ users: [saved], total: 1 });
      if (url === "/api/users/42" && init.method === "PATCH") {
        saved = { ...saved, ...JSON.parse(init.body as string) };
        return jsonResponse(saved);
      }
      if (url === "/api/users/42" && init.method === "DELETE")
        return jsonResponse({ message: "Deleted" });
      if (url === "/api/users/42") return jsonResponse(saved);
      throw new Error(`Unexpected: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    renderFlow("/app/clients");
    const input = userEvent.setup();
    await input.click(await screen.findByRole("button", { name: "Editar Maria Silva" }));
    await fillUser("Maria Santos");
    await input.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("link", { name: "Ver detalhes de Maria Santos" })).toBeTruthy();
    await input.click(await screen.findByRole("button", { name: "Excluir Maria Santos" }));
    await input.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "Ver detalhes de Maria Santos" })).toBeNull(),
    );
  });

  it("admin não vê a exclusão na própria conta", async () => {
    restoreAs(admin);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => jsonResponse(url.endsWith("/51") ? admin : admin)),
    );
    renderFlow("/app/employees/51");
    expect(await screen.findByRole("heading", { name: "Maria Silva" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Excluir conta" })).toBeNull();
    expect(screen.getByRole("button", { name: "Editar nome" })).toBeTruthy();
  });

  it("consulta por URL funciona para profissional sem depender da lista", async () => {
    restoreAs(professional);
    const fetchMock = vi.fn(async (url: string) => {
      if (url.startsWith("/api/schedules")) {
        return jsonResponse({ total: 0, page: 1, limit: 30, data: [] });
      }
      return jsonResponse(url.endsWith("/51") ? professional : client);
    });
    vi.stubGlobal("fetch", fetchMock);
    renderFlow("/app/clients/42");
    expect(await screen.findByRole("heading", { name: "Maria Silva" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Editar nome" })).toBeNull();
    expect(fetchMock.mock.calls.some(([url]) => url.startsWith("/api/users?page="))).toBe(false);
  });

  it("mostra usuário inexistente quando o backend retorna 404", async () => {
    restoreAs(professional);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        jsonResponse(
          url.endsWith("/51") ? professional : { message: "User not found" },
          url.endsWith("/51") ? 200 : 404,
        ),
      ),
    );
    renderFlow("/app/clients/404");
    expect(await screen.findByText("Usuário não encontrado.")).toBeTruthy();
  });

  it("cliente edita o próprio perfil e os dados exibidos são atualizados", async () => {
    restoreAs(client);
    let saved = { ...client };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        if (init.method === "PATCH") saved = { ...saved, ...JSON.parse(init.body as string) };
        return jsonResponse(saved);
      }),
    );
    renderFlow("/perfil");
    const input = userEvent.setup();
    await input.click(await screen.findByRole("button", { name: "Editar nome" }));
    expect((screen.getByLabelText("Nome completo") as HTMLInputElement).disabled).toBe(false);
    expect((screen.getByLabelText("Telefone com DDD") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("E-mail") as HTMLInputElement).disabled).toBe(true);
    await fillUser("Maria Santos");
    await input.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByText("Maria Santos")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Salvar alterações" })).toBeNull();
  });

  it("mostra o histórico real do cliente sem complementos mock", async () => {
    restoreAs(admin);
    const fetchMock = vi.fn(async (url: string) => {
      if (url.startsWith("/api/schedules")) {
        return jsonResponse({
          total: 1,
          page: 1,
          limit: 30,
          data: [
            {
              id: 9,
              procedure_id: 1,
              professional_id: 7,
              client_id: 42,
              document_id: null,
              date: "2026-11-09",
              start_time: "10:00",
              session: 1,
              status: "completed",
              google_event_id: null,
              google_event_link: null,
              procedure: { id: 1, name: "Limpeza", duration_minutes: 30 },
              professional: { id: 7, name: "Prof Teste", phone_number: "11911111111" },
              client: { id: 42, name: "Maria Silva", phone_number: "11912345678" },
            },
          ],
        });
      }
      return jsonResponse(
        url.includes("page=") ? { total: 0, users: [] } : url.endsWith("/51") ? admin : client,
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    renderFlow("/app/clients/42");
    expect(await screen.findByText("Histórico de atendimentos")).toBeTruthy();
    expect(await screen.findByText("Limpeza")).toBeTruthy();
    expect(screen.queryByLabelText("Status demonstrativo")).toBeNull();
    expect(fetchMock.mock.calls.every(([, init]) => init.method === "GET")).toBe(true);
  });
});
