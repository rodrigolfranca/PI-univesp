import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { BrandProvider } from "../context/BrandContext";
import type { AuthUser } from "../context/AuthContext";
import type { ApiUser } from "../services/users";
import { admin, client, professional, SiteWrapper } from "../../test/fixtures";
import { ClientLayout } from "./ClientLayout";
import { RootLayout } from "./RootLayout";

const authState = vi.hoisted(() => ({
  user: null as AuthUser | null,
  token: "token" as string | null,
  logout: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("../services/site", () => ({
  getSiteBrand: vi.fn(async () => null),
  updateSiteBrand: vi.fn(async (brand: unknown) => brand),
  uploadBrandLogo: vi.fn(),
  listGalleryImages: vi.fn(async () => []),
  uploadGalleryImage: vi.fn(),
  updateGalleryImageTitle: vi.fn(),
  deleteGalleryImage: vi.fn(),
}));

function toTestAuthUser(user: ApiUser): AuthUser {
  return {
    userId: user.id,
    clientId: user.client?.id,
    professionalId: user.professional?.id,
    name: user.name,
    phone: user.phone_number,
    email: user.email,
    phoneConfirmed: user.phone_number_confirmed,
    emailConfirmed: user.email_confirmed,
    role: user.professional ? "employee" : "client",
    isAdmin: user.professional?.is_admin === true,
  };
}

function renderLayout(kind: "root" | "client") {
  const isRoot = kind === "root";
  return render(
    <SiteWrapper>
      <BrandProvider>
        <MemoryRouter initialEntries={[isRoot ? "/app" : "/cliente/perfil"]}>
          <Routes>
            <Route
              path={isRoot ? "/app" : "/cliente/perfil"}
              element={isRoot ? <RootLayout /> : <ClientLayout />}
            >
              <Route index element={<p>Conteúdo</p>} />
            </Route>
            <Route path="/login" element={<p>Login</p>} />
          </Routes>
        </MemoryRouter>
      </BrandProvider>
    </SiteWrapper>,
  );
}

beforeEach(() => {
  authState.logout.mockClear();
  authState.token = "token";
});

describe("logout e notificações nos layouts", () => {
  it("mostra Sair no admin/profissional, oculta notificações e encerra a sessão", async () => {
    authState.user = toTestAuthUser(admin);
    renderLayout("root");

    expect(screen.getByRole("button", { name: "Sair" })).toBeTruthy();
    expect(document.querySelector('a[href="/app/notifications"]')).toBeNull();
    expect(screen.getByText("Conteúdo")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(authState.logout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText("Login")).toBeTruthy());
  });

  it("mostra disponibilidade para profissional comum", () => {
    authState.user = toTestAuthUser(professional);
    renderLayout("root");
    expect(screen.getAllByRole("link", { name: "Disponibilidade" })).toHaveLength(2);
    const desktopLinks = Array.from(screen.getAllByRole("navigation")[0].querySelectorAll("a")).map(
      (link) => link.textContent?.trim(),
    );
    expect(desktopLinks).toEqual(["Clientes", "Agendamentos", "Disponibilidade", "Serviços"]);
  });

  it("mantém Agendamentos ativo na rota aninhada de novo agendamento", () => {
    authState.user = toTestAuthUser(client);
    render(
      <SiteWrapper>
        <BrandProvider>
          <MemoryRouter initialEntries={["/cliente/agendamentos/novo"]}>
            <Routes>
              <Route path="/cliente/agendamentos/novo" element={<ClientLayout />}>
                <Route index element={<p>Novo agendamento</p>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </BrandProvider>
      </SiteWrapper>,
    );

    const [desktopAgendamentos] = screen.getAllByRole("link", {
      name: "Agendamentos",
    });
    expect(desktopAgendamentos.className).toContain("bg-brand-100");
    expect(screen.getByText("Novo agendamento")).toBeTruthy();
  });

  it("mostra Sair no cliente, oculta notificações do menu e mantém 2 colunas no mobile", async () => {
    authState.user = toTestAuthUser(client);
    renderLayout("client");

    expect(screen.getByRole("button", { name: "Sair" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Notificações" })).toBeNull();
    expect(screen.getAllByRole("link", { name: "Agendamentos" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Perfil" })).toHaveLength(2);

    const mobileNav = screen.getAllByRole("navigation")[1];
    expect(mobileNav.querySelector("div")?.getAttribute("style")).toContain(
      "repeat(2, minmax(0, 1fr))",
    );

    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(authState.logout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText("Login")).toBeTruthy());
  });
});
