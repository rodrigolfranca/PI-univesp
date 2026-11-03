import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthProvider, toAuthUser, useAuth } from "./AuthContext";
import { AuthGuard } from "../components/AuthGuard";
import { API_STORAGE_SCOPE } from "../services/api";
import { readAccessToken } from "../services/auth";
import { accessToken, admin, client, jsonResponse, SiteWrapper } from "../../test/fixtures";

const sessionKey = `test:auth_session_v1:${API_STORAGE_SCOPE}`;
afterEach(() => vi.unstubAllGlobals());

function Session() {
  const { user, loading, error, login, logout, retrySession } = useAuth();
  return (
    <>
      <p>
        {loading
          ? "Restaurando"
          : user
            ? `${user.name}:${user.role}:${user.isAdmin}`
            : "Sem sessão"}
      </p>
      {error && <p role="alert">{error}</p>}
      <button onClick={() => void login("11912345678", "123456")}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={retrySession}>Retry</button>
    </>
  );
}

function renderSession() {
  return render(
    <SiteWrapper>
      <AuthProvider>
        <Session />
      </AuthProvider>
    </SiteWrapper>,
  );
}

describe("sessão real", () => {
  it("uma sincronização de perfil atrasada não autentica novamente após logout", async () => {
    sessionStorage.setItem(sessionKey, accessToken(client.id));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(client)));
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <SiteWrapper>
          <AuthProvider>{children}</AuthProvider>
        </SiteWrapper>
      ),
    });
    await waitFor(() => expect(result.current.user?.userId).toBe(42));
    const syncAfterRequest = result.current.syncUser;
    act(() => result.current.logout());
    act(() => syncAfterRequest({ ...client, name: "Perfil atrasado" }));
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it("expiração durante a sessão exige novo login ao retornar à janela", async () => {
    sessionStorage.setItem(sessionKey, accessToken(client.id));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(client)));
    renderSession();
    await screen.findByText("Maria Silva:client:false");
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 7_200_000);
    act(() => window.dispatchEvent(new Event("focus")));
    expect(screen.getByText("Sem sessão")).toBeTruthy();
    expect(sessionStorage.getItem(sessionKey)).toBeNull();
  });

  it("descarta o login demonstrativo antigo", async () => {
    sessionStorage.setItem("test:auth_user", JSON.stringify({ role: "employee" }));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderSession();
    expect(await screen.findByText("Sem sessão")).toBeTruthy();
    expect(sessionStorage.getItem("test:auth_user")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("restaura permissões pelo perfil do servidor e limpa token no logout", async () => {
    sessionStorage.setItem(sessionKey, accessToken(admin.id));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(admin)));
    renderSession();
    expect(await screen.findByText("Maria Silva:employee:true")).toBeTruthy();
    act(() => screen.getByText("Logout").click());
    expect(screen.getByText("Sem sessão")).toBeTruthy();
    expect(sessionStorage.getItem(sessionKey)).toBeNull();
  });

  it("valida o código e carrega o perfil antes de autenticar", async () => {
    const token = accessToken(client.id);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: token }))
      .mockResolvedValueOnce(jsonResponse(client));
    vi.stubGlobal("fetch", fetchMock);
    renderSession();
    act(() => screen.getByText("Login").click());
    expect(await screen.findByText("Maria Silva:client:false")).toBeTruthy();
    expect(sessionStorage.getItem(sessionKey)).toBe(token);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/auth/verify-code",
      "/api/users/42",
    ]);
  });

  it("mantém o token após erro de rede e permite tentar novamente", async () => {
    sessionStorage.setItem(sessionKey, accessToken(client.id));
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Offline"))
      .mockResolvedValueOnce(jsonResponse(client));
    vi.stubGlobal("fetch", fetchMock);
    renderSession();
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(sessionStorage.getItem(sessionKey)).not.toBeNull();
    act(() => screen.getByText("Retry").click());
    expect(await screen.findByText("Maria Silva:client:false")).toBeTruthy();
  });

  it("descarta sessão expirada sem enviar chamadas", async () => {
    sessionStorage.setItem(sessionKey, accessToken(client.id, 1));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderSession();
    expect(await screen.findByText("Sem sessão")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(sessionKey)).toBeNull();
  });

  it("não restaura uma conta depois que o usuário saiu durante a consulta", async () => {
    sessionStorage.setItem(sessionKey, accessToken(client.id));
    let resolve!: (value: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise<Response>((done) => {
          resolve = done;
        }),
      ),
    );
    renderSession();
    act(() => screen.getByText("Logout").click());
    await act(async () => {
      resolve(jsonResponse(client));
    });
    expect(screen.getByText("Sem sessão")).toBeTruthy();
  });

  it("guards esperam a restauração e redirecionam cliente que acessa gestão", async () => {
    sessionStorage.setItem(sessionKey, accessToken(client.id));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(client)));
    render(
      <SiteWrapper>
        <AuthProvider>
          <MemoryRouter initialEntries={["/app"]}>
            <Routes>
              <Route element={<AuthGuard role="employee" />}>
                <Route path="/app" element={<p>Painel privado</p>} />
              </Route>
              <Route path="/cliente/perfil" element={<p>Perfil do cliente</p>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </SiteWrapper>,
    );
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.queryByText("Painel privado")).toBeNull();
    await waitFor(() => expect(screen.getByText("Perfil do cliente")).toBeTruthy());
  });

  it("prioriza o vínculo profissional e preserva IDs separados", () => {
    expect(toAuthUser({ ...admin, client: { id: 7 } })).toMatchObject({
      userId: 51,
      professionalId: 8,
      clientId: 7,
      role: "employee",
      isAdmin: true,
    });
    expect(() => readAccessToken("invalid")).toThrow("sessão expirou");
  });
});
