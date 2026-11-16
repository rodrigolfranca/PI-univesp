import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse } from "../../test/fixtures";
import { ContactChangeDialog } from "./ContactChangeDialog";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ token: "token" }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("cronômetro da troca de contato", () => {
  it("permite reenviar após o cooldown e bloqueia a confirmação ao expirar", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () =>
        jsonResponse({ message: "Enviado", expires_in: 300, resend_after: 90 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ContactChangeDialog
        userId={7}
        field="phone"
        currentValue="11912345678"
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    });

    expect(screen.getByRole("timer").textContent).toBe("Código válido por 05:00");
    expect(
      (screen.getByRole("button", { name: "Reenviar em 01:30" }) as HTMLButtonElement).disabled,
    ).toBe(true);

    act(() => vi.advanceTimersByTime(90_000));

    const codeInput = screen.getByLabelText("Código de confirmação") as HTMLInputElement;
    fireEvent.change(codeInput, { target: { value: "123456" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reenviar código" }));
    });

    expect(codeInput.value).toBe("");
    expect(screen.getByRole("timer").textContent).toBe("Código válido por 05:00");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    act(() => vi.advanceTimersByTime(300_000));

    expect(screen.getByRole("timer").textContent).toBe("Código expirado. Reenvie para continuar.");
    expect(
      (screen.getByRole("button", { name: "Confirmar alteração" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
