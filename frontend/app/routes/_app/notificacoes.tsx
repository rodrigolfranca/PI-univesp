import { Title } from "@mantine/core";
import type { Route } from "./+types/notificacoes";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Notificações" },
    { name: "description", content: "Veja suas notificações" },
  ];
}

export default function Notificacoes() {
  return <Title>Notificações</Title>;
}
