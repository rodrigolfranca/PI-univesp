import { afterEach, describe, expect, it, vi } from "vitest";
import { jsonResponse } from "../../test/fixtures";
import {
  deleteGalleryImage,
  getSiteBrand,
  listGalleryImages,
  updateGalleryImageTitle,
  updateSiteBrand,
  uploadBrandLogo,
  uploadGalleryImage,
} from "./site";

const brand = {
  name: "Studio",
  logoUrl: null,
  theme: { preset: "rose", palette: {} },
  aboutTitle: "Sobre",
  aboutParagraphs: ["Texto"],
  whatsappNumber: "5511999999999",
  instagramHandle: "studio",
};

afterEach(() => vi.unstubAllGlobals());

describe("site service", () => {
  it("lê a marca pública", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(brand));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getSiteBrand()).resolves.toEqual(brand);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/site/brand");
  });

  it("salva a marca com PUT autenticado", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(brand));
    vi.stubGlobal("fetch", fetchMock);

    await updateSiteBrand(brand, "token");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/site/brand");
    expect(init.method).toBe("PUT");
    expect(init.headers.Authorization).toBe("Bearer token");
    expect(JSON.parse(init.body)).toEqual(brand);
  });

  it("envia logo como multipart", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ url: "https://cdn/logo.png", path: "site/logo.png" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await uploadBrandLogo(new File(["logo"], "logo.png", { type: "image/png" }), "token");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/site/brand/logo");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("lista, envia, edita e remove imagens da galeria", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ id: 1, url: "https://cdn/1.png" }]))
      .mockResolvedValueOnce(jsonResponse({ id: 2, url: "https://cdn/2.png" }))
      .mockResolvedValueOnce(jsonResponse({ id: 1, url: "https://cdn/1.png", title: "Nova" }))
      .mockResolvedValueOnce(jsonResponse({ message: "Image deleted" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listGalleryImages()).resolves.toEqual([{ id: 1, url: "https://cdn/1.png" }]);
    await uploadGalleryImage(
      new File(["image"], "image.png", { type: "image/png" }),
      "token",
      "Legenda",
    );
    await updateGalleryImageTitle(1, "Nova", "token");
    await deleteGalleryImage(1, "token");

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/site/gallery",
      "/api/site/gallery",
      "/api/site/gallery/1",
      "/api/site/gallery/1",
    ]);
    expect(fetchMock.mock.calls[1][1].body).toBeInstanceOf(FormData);
    expect(fetchMock.mock.calls[3][1].method).toBe("DELETE");
  });
});
