import { Title } from "@mantine/core";
import type { Route } from "./+types/procedimentos";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Procedimentos" },
    { name: "description", content: "Gerencie procedimentos" },
  ];
}

export default function Procedimentos() {
  return <Title>Procedimentos</Title>;
}
