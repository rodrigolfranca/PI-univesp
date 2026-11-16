import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, SiteWrapper } from "../../test/fixtures";
import { AuthProvider } from "../context/AuthContext";
import { BrandProvider } from "../context/BrandContext";
import { SignupPage } from "./SignupPage";

vi.mock("../services/site", () => ({
  getSiteBrand: vi.fn(async () => null),
  updateSiteBrand: vi.fn(async (brand: unknown) => brand),
  uploadBrandLogo: vi.fn(),
  listGalleryImages: vi.fn(async () => []),
  uploadGalleryImage: vi.fn(),
  updateGalleryImageTitle: vi.fn(),
  deleteGalleryImage: vi.fn(),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderSignup() {
  return render(
    <SiteWrapper>
      <AuthProvider>
        <BrandProvider>
          <MemoryRouter initialEntries={["/signup"]}>
            <SignupPage />
          </MemoryRouter>
        </BrandProvider>
      </AuthProvider>
    </SiteWrapper>,
  );
}

function fillForm() {
  fireEvent.change(screen.getByLabelText("Nome completo"), {
    target: { value: "Ana Souza" },
  });
  fireEvent.change(screen.getByLabelText("Telefone com DDD"), {
    target: { value: "(11) 91234-5678" },
  });
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "ana@example.com" },
  });
}

describe("cronômetro do cadastro", () => {
  it("confirma e-mail, depois telefone, com reenvio e expiração", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () =>
        jsonResponse({ signup_id: "signup-1", expires_in: 300, resend_after: 90 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    renderSignup();
    expect(screen.getByRole("link", { name: "Voltar" }).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("button", { name: "Cadastrar" }).className).toContain("w-full");
    fillForm();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));
    });

    expect(screen.getByText("Confirme o código enviado para ana@example.com.")).toBeTruthy();
    expect(screen.queryByLabelText("Código do telefone")).toBeNull();
    expect(screen.queryByRole("button", { name: "Corrigir dados" })).toBeNull();
    expect(screen.getByRole("timer").textContent).toBe("Código válido por 05:00");
    expect(
      (screen.getByRole("button", { name: "Reenviar em 01:30" }) as HTMLButtonElement).disabled,
    ).toBe(true);

    act(() => vi.advanceTimersByTime(90_000));
    expect(screen.getByRole("timer").textContent).toBe("Código válido por 03:30");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reenviar código" }));
    });
    expect(screen.getByRole("timer").textContent).toBe("Código válido por 05:00");

    fireEvent.change(screen.getByLabelText("Código do e-mail"), {
      target: { value: "111111" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar código" }));
    });

    expect(screen.getByText("Confirme o código enviado para (11) 91234-5678.")).toBeTruthy();
    expect(screen.queryByLabelText("Código do e-mail")).toBeNull();
    expect(screen.queryByRole("button", { name: "Corrigir dados" })).toBeNull();
    expect(screen.getByRole("timer").textContent).toBe("Código válido por 05:00");

    act(() => vi.advanceTimersByTime(90_000));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reenviar código" }));
    });
    expect(screen.getByRole("timer").textContent).toBe("Código válido por 05:00");

    act(() => vi.advanceTimersByTime(300_000));
    expect(screen.getByRole("timer").textContent).toBe("Código expirado. Reenvie para continuar.");
    expect(
      (screen.getByRole("button", { name: "Confirmar cadastro" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
  it("mostra o código do e-mail no modal de demonstração", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          signup_id: "signup-1",
          expires_in: 300,
          resend_after: 90,
          demo_code: "111111",
        }),
      ),
    );

    renderSignup();
    fillForm();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));
    });

    expect(screen.getByTestId("otp-code").textContent).toBe("111111");
    expect(screen.getByRole("heading", { name: "Código do e-mail" })).toBeTruthy();
  });
});
