# Controle de acesso

## Matriz atual

| Ação                            | Admin      | Profissional  | Cliente    |
| ------------------------------- | ---------- | ------------- | ---------- |
| Ver todos os agendamentos       | Sim        | Não           | Não        |
| Ver própria agenda              | Sim        | Sim           | Sim        |
| Filtrar agenda por profissional | Sim        | Não           | Não        |
| Criar agendamento para cliente  | Sim        | Não           | Não        |
| Criar próprio agendamento       | Sim        | Não           | Sim        |
| Cancelar agendamento            | Sim        | Não           | Não        |
| Excluir agendamento             | Sim        | Não           | Não        |
| Listar usuários                 | Sim        | Não           | Não        |
| Ver clientes atendidos          | Sim        | Sim, próprios | Não        |
| Consultar usuário por telefone  | Sim        | Não           | Não        |
| Editar próprio perfil           | Sim        | Sim           | Sim        |
| Alterar contato com código      | Sim        | Sim           | Sim        |
| Alterar contato de terceiros    | Sim        | Não           | Não        |
| Criar/editar procedimentos      | Sim        | Não           | Não        |
| Criar/editar POPs               | Sim        | Não           | Não        |
| Gerenciar marca/galeria         | Sim        | Não           | Não        |
| Gerenciar disponibilidade       | Sim        | Própria       | Não        |
| Gerenciar categorias            | Sim        | Não           | Não        |
| Gerenciar equipe                | Sim        | Não           | Não        |
| Conectar Google Agenda          | Sim        | Não           | Não        |
| Ver notificações                | Sim        | Sim           | Sim        |
| Trocar senha                    | Não existe | Não existe    | Não existe |

## Sessão

- login por OTP;
- JWT com `jti`;
- sessão no Redis;
- logout revoga a sessão atual;
- expiração de 2 dias;
- sem refresh token.

## Rate limit

- login/cadastro/recuperação: 10/min por IP + identidade;
- logout: 30/min por usuário;
- contato: 10/min por usuário;
- consulta por telefone: 30/min por IP.

## Limitações atuais

- admin sem vínculo profissional não acessa disponibilidade;
- backend de work schedules não exige admin no controller;
- alguns controles de admin aparecem no frontend para não-admin;
- `ProfessionalOrSelfGuard` existe e não é usado;
- autorização retorna 401 em alguns casos que deveriam ser 403;
- cliente pode excluir a própria conta;
- não há proteção contra excluir o último admin.
