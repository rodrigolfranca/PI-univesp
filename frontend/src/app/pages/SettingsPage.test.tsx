import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsPage } from "./SettingsPage";
import { renderWithSite } from "../../test/harness";
import * as siteService from "../services/site";

const state = vi.hoisted(() => ({
  token: "token" as string | null,
  brand: {
    name: "Studio Teste",
    logoUrl: null as string | null,
    theme: { preset: "rosa", palette: {} },
    aboutTitle: "Sobre",
    aboutParagraphs: ["Parágrafo"],
    whatsappNumber: "5511999999999",
    instagramHandle: "studio",
  },
  updateBrand: vi.fn(),
  images: [] as { id: string; url: string; title?: string }[],
  addImages: vi.fn(),
  removeImage: vi.fn(),
  updateTitle: vi.fn(),
}));
const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ token: state.token }),
}));
vi.mock("../context/BrandContext", () => ({
  useBrand: () => ({ ...state.brand, updateBrand: state.updateBrand }),
  COLOR_THEMES: [
    { id: "rosa", label: "Rosa", hex: "#e11d48" },
    { id: "azul", label: "Azul", hex: "#2563eb" },
  ],
}));
vi.mock("../context/GalleryContext", () => ({
  useGallery: () => ({
    images: state.images,
    addImages: state.addImages,
    removeImage: state.removeImage,
    updateTitle: state.updateTitle,
  }),
}));
vi.mock("../components/UserProfile", () => ({
  UserProfile: () => <div>Perfil do usuário</div>,
}));
vi.mock("../components/GoogleCalendarSettings", () => ({
  GoogleCalendarSettings: () => <div>Google Calendar</div>,
}));
vi.mock("../services/site", () => ({
  uploadBrandLogo: vi.fn(),
}));
vi.mock("sonner", () => ({ toast }));

const mockedSite = vi.mocked(siteService);

describe("SettingsPage", () => {
  beforeEach(() => {
    state.token = "token";
    state.brand = {
      name: "Studio Teste",
      logoUrl: null,
      theme: { preset: "rosa", palette: {} },
      aboutTitle: "Sobre",
      aboutParagraphs: ["Parágrafo"],
      whatsappNumber: "5511999999999",
      instagramHandle: "studio",
    };
    state.images = [{ id: "1", url: "https://cdn/1.png", title: "Antes" }];
    state.updateBrand.mockReset().mockResolvedValue(undefined);
    state.addImages.mockReset().mockResolvedValue(undefined);
    state.removeImage.mockReset().mockResolvedValue(undefined);
    state.updateTitle.mockReset().mockResolvedValue(undefined);
    mockedSite.uploadBrandLogo.mockReset();
    Object.values(toast).forEach((fn) => fn.mockReset());
  });

  it("carrega marca, contatos e galeria existente", () => {
    renderWithSite(<SettingsPage />);

    expect(screen.getByDisplayValue("Studio Teste")).toBeTruthy();
    expect(screen.getByDisplayValue("Sobre")).toBeTruthy();
    expect(screen.getByDisplayValue("5511999999999")).toBeTruthy();
    expect(screen.getByDisplayValue("studio")).toBeTruthy();
    expect(screen.getByAltText("Antes")).toBeTruthy();
    expect(screen.getByText("Perfil do usuário")).toBeTruthy();
    expect(screen.getByText("Google Calendar")).toBeTruthy();
  });

  it("edita e salva a marca", async () => {
    const user = userEvent.setup();
    renderWithSite(<SettingsPage />);

    const name = screen.getByDisplayValue("Studio Teste");
    await user.clear(name);
    await user.type(name, "Nova Marca");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() =>
      expect(state.updateBrand).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nova Marca", aboutTitle: "Sobre" }),
      ),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("faz upload de logo e trata erro", async () => {
    mockedSite.uploadBrandLogo
      .mockResolvedValueOnce({ url: "https://cdn/logo.png", path: "logo" })
      .mockRejectedValueOnce(new Error("Falha no upload"));
    const user = userEvent.setup();
    const { container } = renderWithSite(<SettingsPage />);
    const logoInput = container.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;

    await user.upload(logoInput, new File(["logo"], "logo.png", { type: "image/png" }));
    expect(await screen.findByAltText("Logo preview")).toBeTruthy();
    expect(mockedSite.uploadBrandLogo).toHaveBeenCalledWith(expect.any(File), "token");

    await user.upload(logoInput, new File(["logo2"], "logo2.jpg", { type: "image/jpeg" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Falha no upload"));
  });

  it("envia, edita legenda e remove imagens da galeria", async () => {
    const user = userEvent.setup();
    const { container } = renderWithSite(<SettingsPage />);
    const galleryInput = container.querySelectorAll('input[type="file"]')[1] as HTMLInputElement;

    await user.upload(galleryInput, new File(["img"], "img.png", { type: "image/png" }));
    expect(state.addImages).toHaveBeenCalledWith([expect.any(File)]);

    await user.click(screen.getByRole("button", { name: /Antes/ }));
    const titleInput = screen.getByPlaceholderText("Legenda (opcional)");
    await user.clear(titleInput);
    await user.type(titleInput, "Depois{Enter}");
    expect(state.updateTitle).toHaveBeenCalledWith("1", "Depois");

    await user.click(screen.getByTitle("Remover imagem"));
    expect(state.removeImage).toHaveBeenCalledWith("1");
  });
});
