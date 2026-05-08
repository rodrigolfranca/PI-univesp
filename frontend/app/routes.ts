import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/login", "routes/_auth/login.tsx"),
  layout("routes/_app/layout.tsx", [
    route("/agendamentos", "routes/_app/agendamentos.tsx"),
    route("/procedimentos", "routes/_app/procedimentos.tsx"),
    route("/clientes", "routes/_app/clientes.tsx"),
    route("/notificacoes", "routes/_app/notificacoes.tsx"),
    route("/configuracoes", "routes/_app/configuracoes.tsx"),
  ]),
] satisfies RouteConfig;
