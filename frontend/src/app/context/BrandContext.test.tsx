import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrandProvider, useBrand } from "./BrandContext";
import { SiteProvider } from "../config/SiteContext";
import { keyForSite } from "../config/schema.mjs";
import { testSite } from "../../test/harness";
import * as service from "../services/site";

const auth = vi.hoisted(() => ({
  token: "token" as string | null,
  isAdmin: false,
}));
const remoteBrand = {
  name: "Marca remota",
  logoUrl: null,
  theme: { preset: "rosa", palette: {} },
  aboutTitle: "Sobre remoto",
  aboutParagraphs: ["Parágrafo"],
  whatsappNumber: "5511999999999",
  instagramHandle: "remoto",
};

vi.mock("./AuthContext", () => ({
  useAuth: () => ({
    token: auth.token,
    user: auth.token ? { isAdmin: auth.isAdmin } : null,
  }),
}));
vi.mock("../services/site", () => ({
  getSiteBrand: vi.fn(),
  updateSiteBrand: vi.fn(),
}));

const mocked = vi.mocked(service);
const wrapper = ({ children }: { children: ReactNode }) => (
  <SiteProvider site={testSite}>
    <BrandProvider>{children}</BrandProvider>
  </SiteProvider>
);

describe("BrandContext", () => {
  beforeEach(() => {
    auth.token = "token";
    auth.isAdmin = false;
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("carrega a marca remota", async () => {
    mocked.getSiteBrand.mockResolvedValue(remoteBrand);
    const { result } = renderHook(() => useBrand(), { wrapper });
    await waitFor(() => expect(result.current.name).toBe("Marca remota"));
    expect(result.current.aboutParagraphs).toEqual(["Parágrafo"]);
    expect(document.title).toBe("Marca remota");
  });

  it("usa fallback local quando a API retorna vazio", async () => {
    const key = keyForSite(testSite, window.location.hostname, "brand_config") as string;
    localStorage.setItem(
      key,
      JSON.stringify({
        name: "Marca local",
        aboutTitle: "Local",
        aboutParagraphs: ["Local"],
        whatsappNumber: "5511888888888",
        instagramHandle: "local",
      }),
    );
    mocked.getSiteBrand.mockResolvedValue(null);

    const { result } = renderHook(() => useBrand(), { wrapper });
    await waitFor(() => expect(result.current.name).toBe("Marca local"));
    expect(result.current.instagramHandle).toBe("local");
  });

  it("migra automaticamente para admin quando a API está vazia", async () => {
    auth.isAdmin = true;
    mocked.getSiteBrand.mockResolvedValue(null);
    mocked.updateSiteBrand.mockResolvedValue({
      ...remoteBrand,
      name: testSite.identity.name,
    });

    const { result } = renderHook(() => useBrand(), { wrapper });
    await waitFor(() => expect(mocked.updateSiteBrand).toHaveBeenCalled());
    expect(result.current.name).toBe(testSite.identity.name);
    expect(mocked.updateSiteBrand).toHaveBeenCalledWith(
      expect.objectContaining({ name: testSite.identity.name }),
      "token",
    );
  });

  it("salva alterações e exige sessão", async () => {
    mocked.getSiteBrand.mockResolvedValue(remoteBrand);
    mocked.updateSiteBrand.mockResolvedValue({ ...remoteBrand, name: "Nova marca" });

    const { result } = renderHook(() => useBrand(), { wrapper });
    await waitFor(() => expect(result.current.name).toBe("Marca remota"));

    await act(async () => {
      await result.current.updateBrand({ name: "Nova marca" });
    });
    expect(result.current.name).toBe("Nova marca");

    auth.token = null;
    const anonymous = renderHook(() => useBrand(), { wrapper });
    await waitFor(() => expect(anonymous.result.current.name).toBeTruthy());
    await expect(anonymous.result.current.updateBrand({ name: "X" })).rejects.toThrow(
      "Entre na sua conta para salvar as alterações.",
    );
  });

  it("mantém fallback quando a API falha", async () => {
    mocked.getSiteBrand.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useBrand(), { wrapper });
    await waitFor(() => expect(result.current.name).toBe(testSite.identity.name));
  });
});
