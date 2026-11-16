# Backend — NestJS

API do PI-univesp, usada por duas instâncias de frontend: Dayane e Karina. Cada marca possui seu próprio projeto Vercel, banco Supabase e bucket de imagens. O Upstash Redis é compartilhado com prefixo `SITE_ID`.

- Arquitetura geral: [../docs/architecture/overview.md](../docs/architecture/overview.md)
- Segurança e autenticação: [../docs/architecture/auth-and-security.md](../docs/architecture/auth-and-security.md)
- Deploy: [../docs/operations/deployment.md](../docs/operations/deployment.md)
- Configuração: [../docs/reference/configuration.md](../docs/reference/configuration.md)
- Known issues: [../docs/reference/known-issues.md](../docs/reference/known-issues.md)

## Stack

- NestJS 11 + TypeScript
- Sequelize + PostgreSQL/Supabase
- Redis/Upstash com ioredis
- JWT com sessão revogável no Redis
- class-validator + class-transformer
- Swagger
- Supabase Storage
- Google Calendar API + OAuth 2.0
- Jest + Supertest

## Estrutura

```text
src/
├── common/
│   ├── consts/
│   ├── core/
│   ├── crypto/
│   ├── database/
│   ├── env.validation/
│   ├── health/
│   ├── middlewares/
│   ├── models/
│   ├── otp/
│   ├── rate-limit/
│   ├── redis/
│   ├── swagger/
│   ├── types/
│   └── utils/
├── modules/
│   ├── auth/
│   ├── categories/
│   ├── google-calendar/
│   ├── pops/
│   ├── procedures/
│   ├── schedules/
│   ├── site/
│   └── users/
└── scripts/
```

A maior parte dos módulos segue controller → service → repository. Alguns serviços ainda acessam models diretamente, o que deve ser reduzido ao longo da evolução.

## Setup local

Requisitos: Node.js 22+, Docker e Docker Compose.

```bash
cd backend
cp .env.example .env.dev
npm ci
docker compose --env-file=.env.dev up postgres-service redis-service -d
npm run start:dev
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/documentation`
- Health: `http://localhost:3000/health`

O backend carrega `.env.dev` quando `NODE_ENV=dev`.

Para popular dados de demonstração, com o schema já criado:

```bash
SITE_ID=dayane DB_NAME=univesp NODE_ENV=dev npm run seed:demo
```

## Variáveis de ambiente

Principais grupos:

- `DB_*`, `DB_SSL`, `DB_SSL_CA_BASE64`, `DB_SYNC`
- `REDIS_*` ou `REDIS_URL`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `JWT_SECRET` com pelo menos 64 caracteres
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `GOOGLE_TOKEN_ENCRYPTION_KEY` com 64 caracteres hexadecimais
- `GOOGLE_CALENDAR_TIMEZONE`
- `CORS_ORIGINS`, `TRUST_PROXY`
- `SITE_ID`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
- `AUTH_THROTTLE_TTL_MS`, `AUTH_THROTTLE_LIMIT`

Tabela completa: [../docs/reference/configuration.md](../docs/reference/configuration.md).

## Migrações e seeds

Ordem atual:

```bash
NODE_ENV=prod npm run migrate:schedule-exception-name
NODE_ENV=prod npm run migrate:google-event-link
NODE_ENV=prod npm run migrate:categories
NODE_ENV=prod npm run migrate:procedure-professionals
NODE_ENV=prod npm run migrate:procedure-status
NODE_ENV=prod npm run migrate:brand-gallery
NODE_ENV=prod npm run migrate:confirmed-contacts
NODE_ENV=prod npm run seed:admin
NODE_ENV=prod npm run seed:demo
```

- Use o session pooler do Supabase (`DB_PORT=5432`) para migrações e seeds.
- `DB_SYNC=false` no runtime da Vercel.
- As migrações atuais são scripts idempotentes, mas não possuem ledger, versionamento ou rollback.
- `seed:demo` é exclusivo para demonstração e não deve ser executado com dados reais.

Detalhes e riscos: [../docs/operations/migrations.md](../docs/operations/migrations.md).

## Autenticação e autorização

Fluxos:

- cadastro de cliente em etapas: e-mail e depois telefone;
- login por telefone + OTP;
- recuperação: e-mail atual + novo telefone;
- alteração de contato com confirmação no novo contato;
- gate de confirmação de e-mail para contas criadas por admin.

Sessão:

- JWT assinado com `jti`;
- sessão correspondente no Redis;
- logout revoga a sessão atual;
- cache de usuário no Redis por uma hora.

Perfis:

- `client`: próprios agendamentos e perfil;
- `professional`: própria agenda, clientes atendidos e disponibilidade;
- `admin`: gestão completa da instância.

Detalhes: [../docs/architecture/auth-and-security.md](../docs/architecture/auth-and-security.md) e [../docs/reference/access-control.md](../docs/reference/access-control.md).

## Endpoints principais

### Autenticação

- `POST /auth/request-code`
- `POST /auth/verify-code`
- `POST /auth/logout`
- `POST /auth/signup/request-code`
- `POST /auth/signup/resend-code`
- `POST /auth/signup/verify-email-code`
- `POST /auth/signup/resend-phone-code`
- `POST /auth/signup/verify-phone-code`
- `POST /auth/recovery/request-email-code`
- `POST /auth/recovery/verify-email-code`
- `POST /auth/recovery/request-phone-code`
- `POST /auth/recovery/verify-phone-code`

### Usuários e contato

- `GET /users`
- `GET /users/:id`
- `POST /users/client`
- `POST /users/professional`
- `PATCH /users/:id`
- `DELETE /users/:id`
- `GET /users/by-phone`
- `POST /users/:id/contact/request`
- `POST /users/:id/contact/verify`
- `POST /users/:id/contact/confirm-email/request`

### Procedimentos e categorias

- `GET /procedures`
- `GET /procedures/:id`
- `POST /procedures`
- `PATCH /procedures/:id`
- `DELETE /procedures/:id`
- `GET /categories`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

### Agendas e disponibilidade

- `GET /schedules`
- `POST /schedules`
- `PATCH /schedules/:id`
- `DELETE /schedules/:id`
- `GET /schedules/my-clients`
- `GET /schedules/my-clients/:clientId/history`
- `GET /work-schedules`
- `GET /work-schedules/all`
- `GET /work-schedules/available-dates`
- `GET /work-schedules/availability-summary`
- `POST /work-schedules`
- `PATCH /work-schedules/update/:id`
- `DELETE /work-schedules/delete/:id`
- `GET /schedule-exceptions`
- `POST /schedule-exceptions`
- `PATCH /schedule-exceptions/:id`
- `DELETE /schedule-exceptions/:id`

### POPs, site e Google

- `GET /pops`
- `GET /pops/:id`
- `GET /pops/:id/download`
- `POST /pops`
- `PATCH /pops/:id`
- `DELETE /pops/:id`
- `GET /site/brand`
- `PUT /site/brand`
- `POST /site/brand/logo`
- `GET /site/gallery`
- `POST /site/gallery`
- `PATCH /site/gallery/:id`
- `DELETE /site/gallery/:id`
- `GET /google-calendar/connect`
- `GET /google-calendar/callback`
- `GET /google-calendar/status`
- `POST /google-calendar/sync`
- `DELETE /google-calendar/disconnect`

## Redis e multi-site

Chaves usam `SITE_ID`:

- `<site>:auth_code:*`
- `<site>:signup:*`
- `<site>:recovery:*`
- `<site>:session:*`
- `<site>:user:*`
- `<site>:contact_change:*`
- `<site>:google_oauth_state:*`
- `<site>:ratelimit:*`

Sem `SITE_ID`, o fallback é `site`. Em produção, `SITE_ID` é obrigatório.

Detalhes: [../docs/architecture/multi-site.md](../docs/architecture/multi-site.md).

## Google Calendar

- OAuth 2.0 com escopo `calendar.events`.
- State armazenado no Redis por 10 minutos.
- Refresh token cifrado com AES-256-GCM.
- Uma conexão por banco, pertencente ao admin conectado.
- Eventos são criados/atualizados após operações locais.
- Agendamentos cancelados são atualizados com `[CANCELADO]`.
- Exclusão remove o evento.
- Google → aplicação não é sincronizado.

## Testes

```bash
npm test
npm run test:e2e
npm run test:e2e:cov
```

Estado atual:

- 32 testes unitários;
- 52 testes e2e;
- e2e usa PostgreSQL e Redis reais;
- não há CI configurado.

## Limitações conhecidas do backend

- `demo_code` é retornado sempre; não existe flag de modo demonstração.
- Telefone desconhecido retorna 404, permitindo enumeração de contas.
- CORS não permite `PUT`, mas `PUT /site/brand` é usado pelo frontend.
- Admin sem vínculo profissional não consegue usar a página de disponibilidade.
- Work schedules não têm `AdminGuard` no controller.
- Slots de 15 minutos não consideram a duração total do procedimento.
- Não há validação de data passada.
- Procedimento inativo ainda pode ser agendado.
- Não há proteção transacional contra double booking.
- `session`, `triagem` e `bloqueio_periodo` não são aplicados integralmente.
- Alterações de work schedule podem invalidar agendamentos existentes.
- Migrações não possuem ledger, versionamento nem rollback.
- `DB_SYNC=true` ainda é usado para criar schema fora de produção.
- Sync do Google é síncrono, sem fila, retry ou backoff.
- Uma única conexão Google por banco.
- `GET /health` não verifica DB/Redis.
- Não há request ID, métricas, traces ou alertas.
- `.env.example` e `.env.test.example` possuem valores inválidos para algumas chaves.
- `seed:demo` altera dados existentes e não deve rodar em produção real.

Lista completa: [../docs/reference/known-issues.md](../docs/reference/known-issues.md).
