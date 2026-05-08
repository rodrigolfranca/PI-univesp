import { AppShell, Group, Button, Container, Stack } from "@mantine/core";
import { Outlet, Link, useLocation } from "react-router";
import type { Route } from "./+types/layout";
import styles from "./layout.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Área Logada" },
    { name: "description", content: "Área de usuário logado" },
  ];
}

const navItems = [
  { to: "/agendamentos", label: "Agendamentos" },
  { to: "/procedimentos", label: "Procedimentos" },
  { to: "/clientes", label: "Clientes" },
  { to: "/notificacoes", label: "Notificações" },
  { to: "/configuracoes", label: "Configurações" },
];

export default function AppLayout() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <AppShell footer={{ height: 80 }} layout="default">
      <AppShell.Main pb={100}>
        <Container py="xl">
          <Outlet />
        </Container>
      </AppShell.Main>

      <AppShell.Footer p="md">
        <Group grow gap={0} justify="space-around" style={{ height: "100%" }}>
          {navItems.map((item) => (
            <Button
              key={item.to}
              variant={isActive(item.to) ? "filled" : "subtle"}
              component={Link}
              to={item.to}
              fullWidth
              h="100%"
              radius={0}
              classNames={{ root: styles.navButton }}
            >
              {item.label}
            </Button>
          ))}
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}
