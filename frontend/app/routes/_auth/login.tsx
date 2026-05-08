import { Title } from "@mantine/core";
import type { Route } from "./+types/login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login" },
    { name: "description", content: "Faça login em sua conta" },
  ];
}

export default function Login() {
  return <Title>Login</Title>;
}
