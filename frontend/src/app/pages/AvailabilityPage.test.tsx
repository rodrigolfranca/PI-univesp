import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AvailabilityPage } from "./AvailabilityPage";
import { renderWithSite } from "../../test/harness";

const auth = vi.hoisted(() => ({ isAdmin: true }));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { isAdmin: auth.isAdmin } }),
}));
vi.mock("../components/AvailabilitySettings", () => ({
  AvailabilitySettings: () => <div>Configuração de disponibilidade</div>,
}));

describe("AvailabilityPage", () => {
  it("renderiza para admin", () => {
    auth.isAdmin = true;
    renderWithSite(<AvailabilityPage />);
    expect(screen.getByRole("heading", { name: "Disponibilidade" })).toBeTruthy();
    expect(screen.getByText("Configuração de disponibilidade")).toBeTruthy();
  });

  it("não renderiza conteúdo para não-admin", () => {
    auth.isAdmin = false;
    renderWithSite(<AvailabilityPage />);
    expect(screen.queryByText("Configuração de disponibilidade")).toBeNull();
  });
});
