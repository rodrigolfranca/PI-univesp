import { Title } from "@mantine/core";
import type { Route } from "./+types/configuracoes";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Configurações" },
    { name: "description", content: "Gerencie suas configurações" },
  ];
}

export default function Configuracoes() {
  return <Title>Configurações</Title>;
}
