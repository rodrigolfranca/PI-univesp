import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GalleryProvider, useGallery } from "./GalleryContext";
import { SiteProvider } from "../config/SiteContext";
import { testSite } from "../../test/harness";
import * as service from "../services/site";

const auth = vi.hoisted(() => ({
  token: "token" as string | null,
  isAdmin: false,
}));

vi.mock("./AuthContext", () => ({
  useAuth: () => ({
    token: auth.token,
    user: auth.token ? { isAdmin: auth.isAdmin } : null,
  }),
}));
vi.mock("../services/site", () => ({
  listGalleryImages: vi.fn(),
  uploadGalleryImage: vi.fn(),
  updateGalleryImageTitle: vi.fn(),
  deleteGalleryImage: vi.fn(),
}));

const mocked = vi.mocked(service);
const wrapper = ({ children }: { children: ReactNode }) => (
  <SiteProvider site={testSite}>
    <GalleryProvider>{children}</GalleryProvider>
  </SiteProvider>
);

describe("GalleryContext", () => {
  beforeEach(() => {
    auth.token = "token";
    auth.isAdmin = false;
    vi.clearAllMocks();
  });

  it("carrega e gerencia imagens remotas", async () => {
    mocked.listGalleryImages.mockResolvedValue([
      { id: 1, url: "https://cdn/1.png", title: "Primeira" },
    ]);
    mocked.uploadGalleryImage.mockResolvedValue({ id: 2, url: "https://cdn/2.png" });
    mocked.updateGalleryImageTitle.mockResolvedValue({
      id: 1,
      url: "https://cdn/1.png",
      title: "Nova legenda",
    });
    mocked.deleteGalleryImage.mockResolvedValue();

    const { result } = renderHook(() => useGallery(), { wrapper });
    await waitFor(() => expect(result.current.images).toHaveLength(1));
    expect(result.current.images[0]).toEqual({
      id: "1",
      url: "https://cdn/1.png",
      title: "Primeira",
    });

    await act(async () => {
      await result.current.addImages([new File(["img"], "img.png", { type: "image/png" })]);
    });
    expect(result.current.images).toHaveLength(2);
    expect(mocked.uploadGalleryImage).toHaveBeenCalledWith(expect.any(File), "token");

    await act(async () => {
      await result.current.updateTitle("1", "Nova legenda");
    });
    expect(result.current.images[0].title).toBe("Nova legenda");

    await act(async () => {
      await result.current.removeImage("2");
    });
    expect(result.current.images).toHaveLength(1);
    expect(mocked.deleteGalleryImage).toHaveBeenCalledWith(2, "token");
  });

  it("valida token e IDs nas mutações", async () => {
    mocked.listGalleryImages.mockResolvedValue([]);
    const { result } = renderHook(() => useGallery(), { wrapper });
    await waitFor(() => expect(result.current.images).toEqual([]));

    await expect(result.current.removeImage("abc")).rejects.toThrow("Imagem inválida.");

    auth.token = null;
    const anonymous = renderHook(() => useGallery(), { wrapper });
    await waitFor(() => expect(anonymous.result.current.images).toEqual([]));
    await expect(anonymous.result.current.addImages([new File(["x"], "x.png")])).rejects.toThrow(
      "Entre na sua conta para adicionar imagens.",
    );
  });

  it("cai para o fallback quando a listagem falha", async () => {
    mocked.listGalleryImages.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useGallery(), { wrapper });
    await waitFor(() => expect(result.current.images).toEqual(testSite.catalog.gallery));
  });
});
