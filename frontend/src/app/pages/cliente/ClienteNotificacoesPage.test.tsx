import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ClienteNotificacoesPage } from "./ClienteNotificacoesPage";
import { renderWithSite } from "../../../test/harness";

describe("ClienteNotificacoesPage", () => {
  it("filtra e marca notificações como lidas", async () => {
    const user = userEvent.setup();
    renderWithSite(<ClienteNotificacoesPage />);

    expect(screen.getByText("1 não lida")).toBeTruthy();
    expect(screen.getByText("Lembrete")).toBeTruthy();
    expect(screen.getByText("Confirmado")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Não lidas" }));
    expect(screen.getByText("Lembrete")).toBeTruthy();
    expect(screen.queryByText("Confirmado")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Todas" }));
    await user.click(screen.getByText("Lembrete"));
    expect(screen.getByText("Tudo em dia")).toBeTruthy();
    expect(localStorage.length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Lidas" }));
    expect(screen.getByText("Lembrete")).toBeTruthy();
    expect(screen.getByText("Confirmado")).toBeTruthy();
  });

  it("marca todas como lidas", async () => {
    const user = userEvent.setup();
    renderWithSite(<ClienteNotificacoesPage />);
    await user.click(screen.getByRole("button", { name: "Marcar todas como lidas" }));
    expect(screen.getByText("Tudo em dia")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Marcar todas como lidas" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
