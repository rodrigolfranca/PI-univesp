import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrandProvider } from "../context/BrandContext";
import { AuthProvider } from "../context/AuthContext";
import { jsonResponse, SiteWrapper } from "../../test/fixtures";
import { LoginPage } from "./LoginPage";

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

function renderLogin() {
  return render(
    <SiteWrapper>
      <AuthProvider>
        <BrandProvider>
          <MemoryRouter initialEntries={["/login"]}>
            <LoginPage />
          </MemoryRouter>
        </BrandProvider>
      </AuthProvider>
    </SiteWrapper>,
  );
}

async function requestCode() {
  fireEvent.change(screen.getByLabelText("Telefone"), {
    target: { value: "(11) 91234-5678" },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Solicitar código" }));
  });
}

describe("cronômetro do login", () => {
  it("bloqueia a confirmação ao expirar e reinicia no reenvio", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () =>
        jsonResponse({ message: "Gerado", expires_in: 300, resend_after: 90 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    renderLogin();
    await requestCode();

    expect(screen.getByRole("timer").textContent).toBe("Código válido por 05:00");
    expect(
      (screen.getByRole("button", { name: "Reenviar em 01:30" }) as HTMLButtonElement).disabled,
    ).toBe(true);

    act(() => vi.advanceTimersByTime(90_000));

    expect(screen.getByRole("timer").textContent).toBe("Código válido por 03:30");
    expect(
      (screen.getByRole("button", { name: "Reenviar código" }) as HTMLButtonElement).disabled,
    ).toBe(false);

    act(() => vi.advanceTimersByTime(210_000));

    expect(screen.getByRole("timer").textContent).toBe("Código expirado. Reenvie para continuar.");
    expect((screen.getByRole("button", { name: "Entrar" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reenviar código" }));
    });

    expect(screen.getByRole("timer").textContent).toBe("Código válido por 05:00");
    expect(
      (screen.getByRole("button", { name: "Reenviar em 01:30" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("editar o e-mail no passo do código volta para a etapa inicial", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/auth/recovery/request-email-code")
        return jsonResponse({ recovery_id: "recovery-1", expires_in: 300, resend_after: 90 });
      throw new Error(`Unexpected: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Recuperar conta" }));
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "ana@example.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    });

    expect(screen.getByLabelText("Código do e-mail")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Corrigir e-mail" })).toBeNull();
    expect((screen.getByLabelText("E-mail") as HTMLInputElement).readOnly).toBe(false);

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "outra@example.com" },
    });

    expect(screen.queryByLabelText("Código do e-mail")).toBeNull();
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.getByRole("button", { name: "Enviar código" })).toBeTruthy();
    expect((screen.getByLabelText("E-mail") as HTMLInputElement).value).toBe("outra@example.com");
  });

  it("editar o telefone no passo do código volta para a etapa inicial", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () => jsonResponse({ expires_in: 300, resend_after: 90 }));
    vi.stubGlobal("fetch", fetchMock);

    renderLogin();
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "(11) 91234-5678" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Solicitar código" }));
    });

    expect(screen.getByLabelText("Código de verificação")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Corrigir telefone" })).toBeNull();
    expect((screen.getByLabelText("Telefone") as HTMLInputElement).readOnly).toBe(false);

    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "11999999999" },
    });

    expect(screen.queryByLabelText("Código de verificação")).toBeNull();
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.getByRole("button", { name: "Solicitar código" })).toBeTruthy();
    expect((screen.getByLabelText("Telefone") as HTMLInputElement).value).toBe("11999999999");
  });

  it("permite corrigir o telefone no passo do código sem repetir mensagens", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/auth/recovery/request-email-code")
        return jsonResponse({ recovery_id: "recovery-1", expires_in: 300, resend_after: 90 });
      if (url === "/api/auth/recovery/verify-email-code") return jsonResponse({});
      if (url === "/api/auth/recovery/request-phone-code")
        return jsonResponse({ expires_in: 300, resend_after: 90 });
      throw new Error(`Unexpected: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Recuperar conta" }));
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "ana@example.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    });
    fireEvent.change(screen.getByLabelText("Código do e-mail"), {
      target: { value: "111111" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar código" }));
    });

    expect(
      screen.getAllByText("E-mail confirmado. Informe o novo telefone da conta."),
    ).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Novo telefone"), {
      target: { value: "(11) 91234-5678" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    });

    expect(screen.queryByRole("button", { name: "Corrigir telefone" })).toBeNull();
    expect(screen.queryByText(/E-mail confirmado/)).toBeNull();
    expect((screen.getByLabelText("Novo telefone") as HTMLInputElement).readOnly).toBe(false);

    fireEvent.change(screen.getByLabelText("Novo telefone"), {
      target: { value: "11999999999" },
    });

    expect(screen.queryByLabelText("Código do novo telefone")).toBeNull();
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.getByRole("button", { name: "Enviar código" })).toBeTruthy();
    expect((screen.getByLabelText("Novo telefone") as HTMLInputElement).value).toBe("11999999999");
  });

  it("expira o código do e-mail na recuperação", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/auth/recovery/request-email-code")
        return jsonResponse({ recovery_id: "recovery-1", expires_in: 300, resend_after: 90 });
      throw new Error(`Unexpected: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Recuperar conta" }));
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "ana@example.com" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    });

    expect(screen.getByRole("timer").textContent).toBe("Código válido por 05:00");
    expect(
      (screen.getByRole("button", { name: "Reenviar em 01:30" }) as HTMLButtonElement).disabled,
    ).toBe(true);

    act(() => vi.advanceTimersByTime(300_000));

    expect(screen.getByRole("timer").textContent).toBe("Código expirado. Reenvie para continuar.");
    expect(
      (screen.getByRole("button", { name: "Confirmar código" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("expira o código do novo telefone na recuperação", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/auth/recovery/request-email-code")
        return jsonResponse({ recovery_id: "recovery-1", expires_in: 300, resend_after: 90 });
      if (url === "/api/auth/recovery/verify-email-code") return jsonResponse({});
      if (url === "/api/auth/recovery/request-phone-code")
        return jsonResponse({ expires_in: 300, resend_after: 90 });
      throw new Error(`Unexpected: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Recuperar conta" }));
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "ana@example.com" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    });
    fireEvent.change(screen.getByLabelText("Código do e-mail"), {
      target: { value: "111111" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirmar código" }));
    });
    fireEvent.change(screen.getByLabelText("Novo telefone"), {
      target: { value: "(11) 91234-5678" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    });

    expect(screen.getByRole("timer").textContent).toBe("Código válido por 05:00");
    act(() => vi.advanceTimersByTime(300_000));

    expect(screen.getByRole("timer").textContent).toBe("Código expirado. Reenvie para continuar.");
    expect(
      (screen.getByRole("button", { name: "Confirmar novo telefone" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
