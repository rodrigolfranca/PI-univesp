import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarNavigation } from "./CalendarNavigation";

describe("CalendarNavigation", () => {
  it("mantém a data entre as setas e expõe o atalho Hoje", async () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onToday = vi.fn();
    const onSync = vi.fn();
    const user = userEvent.setup();

    render(
      <CalendarNavigation
        label="9–15 de Novembro 2026"
        onPrevious={onPrevious}
        onNext={onNext}
        onToday={onToday}
        onSync={onSync}
      />,
    );

    expect(screen.getByText("9–15 de Novembro 2026")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Ir para hoje" }));
    await user.click(screen.getByRole("button", { name: "Período anterior" }));
    await user.click(screen.getByRole("button", { name: "Próximo período" }));
    await user.click(screen.getByRole("button", { name: "Sincronizar" }));

    expect(onToday).toHaveBeenCalledOnce();
    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
    expect(onSync).toHaveBeenCalledOnce();
  });

  it("omite a sincronização quando o callback não é informado", () => {
    render(
      <CalendarNavigation
        label="Novembro 2026"
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onToday={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Sincronizar" })).toBeNull();
    expect(screen.getByRole("button", { name: "Ir para hoje" })).toBeTruthy();
  });
});
