import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { AuthGuard } from "./AuthGuard";
import { AuthProvider } from "../context/AuthContext";
import { BrandProvider } from "../context/BrandContext";
import { API_STORAGE_SCOPE } from "../services/api";
import {
  accessToken,
  client,
  jsonResponse,
  SiteWrapper,
  unconfirmedClient,
} from "../../test/fixtures";

const sessionKey = `test:auth_session_v1:${API_STORAGE_SCOPE}`;

afterEach(() => {
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("confirmação de contato no primeiro acesso", () => {
  it("bloqueia a área até confirmar o e-mail e libera após o código", async () => {
    let confirmed = false;
    const fetchMock = vi.fn(async (url: string) => {
      if (url === `/api/users/${unconfirmedClient.id}`)
        return jsonResponse(confirmed ? client : unconfirmedClient);
      if (url === `/api/users/${unconfirmedClient.id}/contact/confirm-email/request`)
        return jsonResponse({ expires_in: 300, resend_after: 90 });
      if (url === `/api/users/${unconfirmedClient.id}/contact/verify`) {
        confirmed = true;
        return jsonResponse({});
      }
      throw new Error(`Unexpected: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.setItem(sessionKey, accessToken(unconfirmedClient.id));

    render(
      <SiteWrapper>
        <AuthProvider>
          <BrandProvider>
            <MemoryRouter initialEntries={["/cliente/perfil"]}>
              <Routes>
                <Route element={<AuthGuard role="client" />}>
                  <Route path="/cliente/perfil" element={<p>Área liberada</p>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </BrandProvider>
        </AuthProvider>
      </SiteWrapper>,
    );

    expect(await screen.findByRole("heading", { name: "Confirme seu e-mail" })).toBeTruthy();
    expect(screen.queryByText("Área liberada")).toBeNull();

    const input = userEvent.setup();
    await input.click(screen.getByRole("button", { name: "Enviar código" }));
    await input.type(await screen.findByLabelText("Código do e-mail"), "123456");
    await input.click(screen.getByRole("button", { name: "Confirmar e continuar" }));

    await waitFor(() => expect(screen.getByText("Área liberada")).toBeTruthy());
    expect(confirmed).toBe(true);
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith("/contact/verify"))).toBe(true);
  });

  it("não bloqueia sessões antigas sem o campo email_confirmed", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === `/api/users/${client.id}`)
        return jsonResponse({ ...client, email_confirmed: undefined });
      throw new Error(`Unexpected: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.setItem(sessionKey, accessToken(client.id));

    render(
      <SiteWrapper>
        <AuthProvider>
          <BrandProvider>
            <MemoryRouter initialEntries={["/cliente/perfil"]}>
              <Routes>
                <Route element={<AuthGuard role="client" />}>
                  <Route path="/cliente/perfil" element={<p>Área liberada</p>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </BrandProvider>
        </AuthProvider>
      </SiteWrapper>,
    );

    expect(await screen.findByText("Área liberada")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Confirme seu e-mail" })).toBeNull();
  });
});
