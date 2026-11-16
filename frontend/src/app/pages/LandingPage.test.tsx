import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingPage } from "./LandingPage";
import { renderWithSite } from "../../test/harness";
import type { Procedure } from "../config/types";

const state = vi.hoisted(() => ({
  brand: {
    name: "Studio Teste",
    logoUrl: null as string | null,
    theme: { preset: "rose", palette: {} },
    aboutTitle: "Sobre o studio",
    aboutParagraphs: ["Primeiro parágrafo", "", "Segundo parágrafo"],
    whatsappNumber: "5511999999999",
    instagramHandle: "studio.teste",
  },
  procedures: [] as Procedure[],
  images: [] as { id: string; url: string; title?: string }[],
}));

vi.mock("../context/BrandContext", () => ({
  useBrand: () => state.brand,
}));
vi.mock("../context/GalleryContext", () => ({
  useGallery: () => ({ images: state.images }),
}));
vi.mock("../context/ProceduresContext", () => ({
  useProcedures: () => ({ procedures: state.procedures }),
}));
vi.mock("../services/pops", () => ({
  listPops: async () => [],
  downloadPop: vi.fn(),
}));

describe("LandingPage", () => {
  it("renderiza conteúdo principal, contato, tratamentos ativos e modal de detalhes", async () => {
    state.procedures = [
      {
        id: 1,
        name: "Limpeza de pele",
        category: "Facial",
        duration: "60 min",
        price: "R$ 150,00",
        status: "Ativo",
        description: "Pele renovada",
        durationMinutes: 60,
        sessions: 1,
        triagem: false,
        triagemMinutes: 0,
        bloqueioPeriodo: null,
        professionals: [{ id: 1, name: "Admin QA" }],
      },
      {
        id: 2,
        name: "Botox",
        category: "Injetável",
        duration: "30 min",
        price: "R$ 900,00",
        status: "Inativo",
        description: "Linhas suaves",
        durationMinutes: 30,
        sessions: 1,
        triagem: false,
        triagemMinutes: 0,
        bloqueioPeriodo: null,
        professionals: [{ id: 1, name: "Admin QA" }],
      },
    ];
    state.images = [
      { id: "g1", url: "/galeria-1.jpg", title: "Antes e depois" },
      { id: "g2", url: "/galeria-2.jpg" },
    ];
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    renderWithSite(<LandingPage />);

    expect(screen.getAllByText("Studio Teste").length).toBeGreaterThan(0);
    expect(screen.getByText("Seu momento de cuidado")).toBeTruthy();
    expect(screen.getByText("Limpeza de pele")).toBeTruthy();
    expect(screen.queryByText("Botox")).toBeNull();
    expect(screen.getByText("Nossa galeria")).toBeTruthy();
    expect(screen.getByAltText("Antes e depois")).toBeTruthy();
    const address = screen.getByText("Rua Teste, 123, São Paulo - SP");
    expect(address.getAttribute("title")).toBe("Rua Teste, 123, São Paulo - SP");
    expect(screen.getByText("(11) 99999-9999")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "(11) 99999-9999" })).toBeNull();
    const mapsRoute = screen
      .getByRole("link", { name: "Abrir rota no Google Maps" })
      .getAttribute("href");
    expect(mapsRoute).toContain("https://www.google.com/maps/dir/?api=1&destination=");
    expect(mapsRoute).toContain("Studio%20Teste");
    expect(
      screen
        .getByRole("link", { name: "Abrir rota no Google Maps" })
        .querySelector("img")
        ?.getAttribute("src"),
    ).toBe("/logos/google-maps.png");
    const wazeRoute = screen.getByRole("link", { name: "Abrir rota no Waze" }).getAttribute("href");
    expect(wazeRoute).toContain("https://waze.com/ul?q=");
    expect(wazeRoute).toContain("Studio%20Teste");
    expect(
      screen
        .getByRole("link", { name: "Abrir rota no Waze" })
        .querySelector("img")
        ?.getAttribute("src"),
    ).toBe("/logos/waze.png");
    expect(screen.getByRole("link", { name: "Enviar e-mail" }).getAttribute("href")).toBe(
      "mailto:contato@studio.test",
    );
    expect(
      screen
        .getByRole("link", { name: "Agendar pelo WhatsApp" })
        .compareDocumentPosition(screen.getByText("Horário")) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver no Instagram" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Onde estamos" })).toBeTruthy();
    const map = screen.getByTitle("Mapa da localização");
    expect(map.getAttribute("src")).toContain("output=embed");
    expect(map.getAttribute("src")).toContain("Studio%20Teste");
    expect(screen.getByRole("link", { name: "Nos avalie no Google" }).getAttribute("href")).toBe(
      "https://maps.app.goo.gl/test-review",
    );
    expect(screen.getByText("Horário")).toBeTruthy();
    expect(screen.getByText("Segunda a sexta:")).toBeTruthy();
    expect(screen.getByText("9h às 18h")).toBeTruthy();
    expect(
      screen.getByText("Endereço").compareDocumentPosition(screen.getByText("Horário")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Agendar pelo WhatsApp" }).getAttribute("href"),
    ).toContain("wa.me");
    expect(screen.getByRole("link", { name: "Agendar agora" }).getAttribute("href")).toBe(
      "/login?treatmentId=1",
    );
    expect(screen.getByRole("link", { name: "Entrar" }).getAttribute("href")).toBe("/login");
    expect(screen.getByTitle("WhatsApp").getAttribute("href")).toContain("wa.me");
    expect(screen.getByTitle("Instagram").getAttribute("href")).toContain("instagram.com");

    await user.click(screen.getByRole("link", { name: "Galeria" }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });

    await user.click(screen.getByRole("button", { name: "Ver detalhes" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Limpeza de pele")).toBeTruthy();
    expect(within(dialog).getByText("Pele renovada")).toBeTruthy();
    expect(within(dialog).getByText("60 min")).toBeTruthy();
    expect(within(dialog).getByText("R$ 150,00")).toBeTruthy();
    expect(within(dialog).getByRole("link", { name: "Agendar agora" }).getAttribute("href")).toBe(
      "/login?treatmentId=1",
    );
  });

  it("abre detalhes ao clicar no card e não ao clicar em agendar", async () => {
    state.procedures = [
      {
        id: 1,
        name: "Limpeza de pele",
        category: "Facial",
        duration: "60 min",
        price: "R$ 150,00",
        status: "Ativo",
        description: "Pele renovada",
        durationMinutes: 60,
        sessions: 1,
        triagem: false,
        triagemMinutes: 0,
        bloqueioPeriodo: null,
        professionals: [{ id: 1, name: "Admin QA" }],
      },
    ];
    state.images = [];
    state.brand = {
      ...state.brand,
      aboutTitle: "",
      aboutParagraphs: [],
      whatsappNumber: "",
      instagramHandle: "",
    };
    const user = userEvent.setup();

    renderWithSite(<LandingPage />);

    await user.click(screen.getByRole("link", { name: "Agendar agora" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(screen.getByText("Limpeza de pele"));
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("rola para a âncora informada na URL", async () => {
    state.procedures = [];
    state.images = [];
    state.brand = {
      ...state.brand,
      aboutTitle: "Sobre o studio",
      aboutParagraphs: ["Parágrafo"],
      whatsappNumber: "",
      instagramHandle: "",
    };
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    renderWithSite(<LandingPage />, { route: "/#sobre" });

    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" }),
    );
  });

  it("mostra estado vazio e oculta seções sem conteúdo", () => {
    state.procedures = [];
    state.images = [];
    state.brand = {
      ...state.brand,
      aboutTitle: "",
      aboutParagraphs: [],
      whatsappNumber: "",
      instagramHandle: "",
    };

    renderWithSite(<LandingPage />);

    expect(screen.getByText(/Nenhum serviço disponível no momento/)).toBeTruthy();
    expect(screen.queryByText("Nossa galeria")).toBeNull();
    expect(screen.getByRole("link", { name: "Fale conosco" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Sobre" })).toBeNull();
    expect(screen.queryByTitle("WhatsApp")).toBeNull();
    expect(screen.queryByTitle("Instagram")).toBeNull();
  });
});
