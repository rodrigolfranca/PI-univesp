import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { SiteProvider } from "../app/config/SiteContext";
import { normalizeConfig } from "../app/config/schema.mjs";
import type { SiteConfig } from "../app/config/types";

export const testSite = normalizeConfig(
  { id: "test", domains: [] },
  {
    identity: {
      name: "Studio Teste",
      tagline: "Beleza e cuidado",
      description: "Agenda de teste",
    },
    content: {
      hero: "Seu momento de cuidado",
      catalogTitle: "Nossos tratamentos",
      catalogIntro: "Escolha o melhor para você",
      contactTitle: "Fale conosco",
      contactIntro: "Estamos prontos para atender",
    },
    contact: {
      whatsapp: "5511999999999",
      instagram: "studio.teste",
    },
    catalog: {
      icon: "sparkles",
    },
    data: {
      clientNotifications: [
        {
          id: "n1",
          type: "lembrete",
          title: "Lembrete",
          body: "Seu atendimento é amanhã.",
          time: "Hoje",
          read: false,
        },
        {
          id: "n2",
          type: "confirmacao",
          title: "Confirmado",
          body: "Seu horário foi confirmado.",
          time: "Ontem",
          read: true,
        },
      ],
    },
  },
) as SiteConfig;

export function renderWithSite(ui: ReactNode, { route = "/" }: { route?: string } = {}) {
  return render(
    <SiteProvider site={testSite}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </SiteProvider>,
  );
}
