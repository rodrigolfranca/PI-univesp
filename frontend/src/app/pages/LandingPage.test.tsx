import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandingPage } from "./LandingPage";
import { renderWithSite } from "../../test/harness";

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
  procedures: [] as {
    id: number;
    name: string;
    category: string;
    description: string;
    status: string;
  }[],
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

describe("LandingPage", () => {
  it("renderiza conteúdo principal, tratamentos ativos e links", async () => {
    state.procedures = [
      {
        id: 1,
        name: "Limpeza de pele",
        category: "Facial",
        description: "Pele renovada",
        status: "Ativo",
      },
      {
        id: 2,
        name: "Botox",
        category: "Injetável",
        description: "Linhas suaves",
        status: "Inativo",
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
    expect(screen.getByRole("link", { name: "Ver detalhes" }).getAttribute("href")).toBe(
      "/tratamentos/1",
    );
    expect(screen.getByRole("link", { name: "Agendar agora" }).getAttribute("href")).toBe(
      "/login?treatmentId=1",
    );
    expect(screen.getByRole("link", { name: "Entrar" }).getAttribute("href")).toBe("/login");
    expect(screen.getByTitle("WhatsApp").getAttribute("href")).toContain("wa.me");
    expect(screen.getByTitle("Instagram").getAttribute("href")).toContain("instagram.com");

    await user.click(screen.getByRole("link", { name: "Galeria" }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
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
    expect(screen.queryByText("Fale conosco")).toBeNull();
    expect(screen.queryByRole("link", { name: "Sobre" })).toBeNull();
    expect(screen.queryByTitle("WhatsApp")).toBeNull();
    expect(screen.queryByTitle("Instagram")).toBeNull();
  });
});
