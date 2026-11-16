import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OtpCodeModalHost } from "./OtpCodeModal";
import { reopenOtpCode, resetOtpCode, showOtpCode } from "../services/otp-code";

describe("OtpCodeModalHost", () => {
  beforeEach(() => {
    resetOtpCode();
  });

  afterEach(() => {
    resetOtpCode();
  });

  it("exibe, copia e reabre o último código", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(<OtpCodeModalHost />);

    act(() => {
      showOtpCode({
        code: "123456",
        title: "Código de login",
        description: "Use este código para entrar.",
        expiresIn: 300,
      });
    });

    expect(screen.getByTestId("otp-code").textContent).toBe("123456");
    await user.click(screen.getByRole("button", { name: "Copiar código" }));
    expect(writeText).toHaveBeenCalledWith("123456");

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByTestId("otp-code")).toBeNull();

    act(() => reopenOtpCode());
    expect(screen.getByTestId("otp-code").textContent).toBe("123456");
  });
});
