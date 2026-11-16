# Autenticação e segurança

## Visão geral

- senha não existe;
- login por telefone e OTP;
- JWT com `jti`;
- sessão revogável armazenada no Redis;
- autorização por perfil;
- rate limit por IP/identidade/usuário.

## Cadastro de cliente

1. nome, telefone e e-mail;
2. código do e-mail;
3. código do telefone;
4. criação do cliente com contatos confirmados.

Os dados temporários ficam no Redis por 10 minutos. Cada código vale 5 minutos e o reenvio é permitido após 90 segundos.

## Login

1. telefone;
2. código OTP;
3. validação do código;
4. marcação do telefone como confirmado;
5. criação de `jti`;
6. sessão no Redis por 2 dias;
7. JWT assinado com `id` e `jti`.

## Recuperação

1. e-mail atual;
2. código do e-mail;
3. novo telefone;
4. código do novo telefone;
5. atualização do telefone;
6. marcação do e-mail como confirmado.

## Alteração de contato

- exige código no novo telefone/e-mail;
- rejeita contato igual ao atual;
- rejeita contato de outra conta;
- o gate de primeiro acesso confirma o e-mail atual.

## Guardas

- `AuthGuard`: valida JWT, `jti`, sessão Redis e carrega usuário.
- `AdminGuard`: exige admin.
- `AdminOrSelfGuard`: admin ou o próprio usuário.
- `ScheduleCreateGuard`: admin ou cliente dono do agendamento.
- `ProfessionalOrSelfGuard`: existe, mas não é usado.

## Perfis

| Ação                      | Cliente | Profissional | Admin    |
| ------------------------- | ------- | ------------ | -------- |
| Ver próprios agendamentos | Sim     | Sim          | Sim      |
| Ver agenda de terceiros   | Não     | Não          | Sim      |
| Criar próprio agendamento | Sim     | Não          | Sim      |
| Gerenciar disponibilidade | Não     | Própria      | Qualquer |
| Gerenciar usuários        | Não     | Não          | Sim      |
| Gerenciar procedimentos   | Não     | Vinculados   | Sim      |
| Gerenciar marca/galeria   | Não     | Não          | Sim      |
| Conectar Google Agenda    | Não     | Não          | Sim      |

Detalhes: [Controle de acesso](../reference/access-control.md).

## Redis

- `<site>:auth_code:*`
- `<site>:signup:*`
- `<site>:recovery:*`
- `<site>:session:*`
- `<site>:user:*`
- `<site>:contact_change:*`
- `<site>:google_oauth_state:*`
- `<site>:ratelimit:*`

Sem `SITE_ID`, o fallback é `site`.

## Rate limit

- auth: 10/min por IP + identidade;
- logout: 30/min por usuário;
- contato: 10/min por usuário;
- consulta por telefone: 30/min por IP;
- Upstash REST quando configurado;
- fallback em memória em dev/test.

## Google Calendar

- OAuth state por 10 minutos;
- refresh token cifrado com AES-256-GCM;
- escopo `calendar.events`;
- uma conexão por banco.

## Riscos atuais

- `demo_code` retornado sempre;
- telefone desconhecido retorna 404;
- OTP sem contador de tentativas;
- cache de usuário pode ficar 1h desatualizado;
- callback OAuth não revalida admin;
- CORS sem `PUT`;
- `SITE_ID` só é obrigatório em produção;
- fallback de rate limit em memória sem prefixo de site.

Lista completa: [Known issues](../reference/known-issues.md).

## Modo demonstração

O modo demo atual é inseguro por definição:

- códigos aparecem no navegador;
- não há flag para desativar;
- qualquer pessoa com o telefone pode entrar.

Não usar com dados reais. Ver [Modo demonstração](../reference/demo-mode.md).
