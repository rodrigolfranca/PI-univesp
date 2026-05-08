import { Title } from "@mantine/core";
import type { Route } from "./+types/agendamentos";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Agendamentos" },
    { name: "description", content: "Gerencie seus agendamentos" },
  ];
}

export default function Agendamentos() {
  return <Title>Agendamentos</Title>;
}
