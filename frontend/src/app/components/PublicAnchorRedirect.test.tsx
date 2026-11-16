import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { describe, expect, it } from "vitest";
import { PublicAnchorRedirect } from "./PublicAnchorRedirect";

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.hash}`}</p>;
}

describe("PublicAnchorRedirect", () => {
  it.each([
    { path: "/tratamentos", anchor: "tratamentos" },
    { path: "/tratamentos/1", anchor: "tratamentos" },
    { path: "/sobre", anchor: "sobre" },
    { path: "/contato", anchor: "contato" },
  ])("redireciona $path para /#$anchor", ({ path, anchor }) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/tratamentos" element={<PublicAnchorRedirect anchor="tratamentos" />} />
          <Route path="/tratamentos/:id" element={<PublicAnchorRedirect anchor="tratamentos" />} />
          <Route path="/sobre" element={<PublicAnchorRedirect anchor="sobre" />} />
          <Route path="/contato" element={<PublicAnchorRedirect anchor="contato" />} />
          <Route path="/" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("location").textContent).toBe(`/#${anchor}`);
  });
});
