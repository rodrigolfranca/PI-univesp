import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AvailabilityPage } from "./AvailabilityPage";
import { renderWithSite } from "../../test/harness";

const auth = vi.hoisted(() => ({
  isAdmin: true,
  professionalId: null as number | null,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { isAdmin: auth.isAdmin, professionalId: auth.professionalId },
  }),
}));
vi.mock("../components/AvailabilitySettings", () => ({
  AvailabilitySettings: () => <div>Configuração de disponibilidade</div>,
}));

describe("AvailabilityPage", () => {
  it("renderiza para admin", () => {
    auth.isAdmin = true;
    auth.professionalId = 8;
    renderWithSite(<AvailabilityPage />);
    expect(screen.getByRole("heading", { name: "Disponibilidade" })).toBeTruthy();
    expect(screen.getByText("Configuração de disponibilidade")).toBeTruthy();
  });

  it("renderiza para profissional", () => {
    auth.isAdmin = false;
    auth.professionalId = 8;
    renderWithSite(<AvailabilityPage />);
    expect(screen.getByRole("heading", { name: "Disponibilidade" })).toBeTruthy();
    expect(screen.getByText("Configuração de disponibilidade")).toBeTruthy();
  });

  it("não renderiza conteúdo para cliente", () => {
    auth.isAdmin = false;
    auth.professionalId = null;
    renderWithSite(<AvailabilityPage />);
    expect(screen.queryByText("Configuração de disponibilidade")).toBeNull();
  });
});
