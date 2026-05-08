import { Title } from "@mantine/core";
import type { Route } from "./+types/clientes";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Clientes" },
    { name: "description", content: "Gerencie seus clientes" },
  ];
}

export default function Clientes() {
  return <Title>Clientes</Title>;
}
