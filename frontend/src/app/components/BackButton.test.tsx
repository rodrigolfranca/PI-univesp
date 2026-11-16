import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { BackButton } from "./BackButton";

function Location() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

describe("BackButton", () => {
  it("navega para o destino informado", async () => {
    render(
      <MemoryRouter initialEntries={["/app/procedures/1"]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <BackButton to="/app/procedures" label="Voltar para Procedimentos" />
                <Location />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Voltar para Procedimentos" })).toBeTruthy();
    await userEvent.click(screen.getByRole("link", { name: "Voltar para Procedimentos" }));
    expect(screen.getByTestId("location").textContent).toBe("/app/procedures");
  });

  it("executa a ação de voltar quando não há destino fixo", async () => {
    let clicked = false;
    render(
      <MemoryRouter>
        <BackButton onClick={() => (clicked = true)} label="Voltar" />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect(clicked).toBe(true);
  });
});
