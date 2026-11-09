import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClientePerfilPage } from "./ClientePerfilPage";
import { renderWithSite } from "../../../test/harness";

vi.mock("../../components/UserProfile", () => ({
  UserProfile: () => <div>Perfil completo</div>,
}));

describe("ClientePerfilPage", () => {
  it("renderiza o perfil do usuário", () => {
    renderWithSite(<ClientePerfilPage />);
    expect(screen.getByText("Perfil completo")).toBeTruthy();
  });
});
