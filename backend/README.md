# Backend - NestJS

API do sistema de agendamentos, usada por dois frontends (Dayane e Karina). Cada marca tem seu próprio projeto Vercel, banco Supabase e bucket de imagens; o Upstash é compartilhado com prefixo `SITE_ID`.

Consulte [arquitetura multi-site](../docs/MULTISITE.md) e [deploy](../docs/DEPLOY.md).

## Stack

- NestJS + Sequelize + PostgreSQL (Supabase)
- Redis (Upstash) para OTP, cache, sessões, OAuth e rate limit
- JWT com `jti` e sessão revogável no Redis
- Supabase Storage para logo e galeria
- Google Calendar API

## Setup local

Requisitos: Node.js 22+, Docker e Docker Compose.

```bash
cd backend
cp .env.example .env.dev
npm ci
docker compose --env-file=.env.dev up postgres-service redis-service -d
npm run start:dev
```

O backend usa `NODE_ENV=dev` para carregar `.env.dev`. A API fica em `http://localhost:3000` e o Swagger em `/documentation`.

## Variáveis principais

- `DB_*`, `DB_SSL`, `DB_SSL_CA_BASE64`
- `REDIS_*` ou `REDIS_URL`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `JWT_SECRET` (mínimo 64 caracteres)
- `GOOGLE_*`, `GOOGLE_TOKEN_ENCRYPTION_KEY`
- `CORS_ORIGINS`, `TRUST_PROXY`
- `SITE_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
- `AUTH_THROTTLE_TTL_MS`, `AUTH_THROTTLE_LIMIT`

Nunca comite `.env.dev`, `.env.prod` ou credenciais reais.

## Migrações e seed

Rode uma vez por banco, na ordem:

```bash
NODE_ENV=prod npm run migrate:schedule-exception-name
NODE_ENV=prod npm run migrate:google-event-link
NODE_ENV=prod npm run migrate:categories
NODE_ENV=prod npm run migrate:procedure-status
NODE_ENV=prod npm run migrate:brand-gallery
NODE_ENV=prod npm run seed:admin
```

Use o session pooler (`DB_PORT=5432`) para migrações e seed. Depois, mantenha `DB_SYNC=false` no runtime da Vercel.

## Endpoints principais

- `POST /auth/request-code`, `POST /auth/verify-code`
- `POST /auth/recovery/request-code`, `POST /auth/recovery/verify-code`
- `POST /auth/logout` (revoga a sessão atual)
- `GET /users`, `GET /users/:id`, `POST /users/client`, `POST /users/professional`
- `GET /users/by-phone` (admin)
- `POST /users/:id/contact/request`, `POST /users/:id/contact/verify`
- `GET /schedules`, `POST /schedules`, `PATCH /schedules/:id`, `DELETE /schedules/:id`
- `GET /schedules/my-clients`, `GET /schedules/my-clients/:clientId/history`
- `GET /work-schedules`, `GET /work-schedules/all`, `POST /work-schedules`
- `PATCH /work-schedules/update/:id`, `DELETE /work-schedules/delete/:id`
- `GET /schedule-exceptions`, `POST /schedule-exceptions`, `PATCH /schedule-exceptions/:id`
- `GET /procedures`, `POST /procedures`, `PATCH /procedures/:id`, `DELETE /procedures/:id`
- `GET /categories`, `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id`
- `GET /pops`, `GET /pops/:id/download`, `POST /pops`, `PATCH /pops/:id`, `DELETE /pops/:id`
- `GET /site/brand`, `PUT /site/brand`, `POST /site/brand/logo`
- `GET /site/gallery`, `POST /site/gallery`, `PATCH /site/gallery/:id`, `DELETE /site/gallery/:id`
- `GET /google-calendar/status`, `GET /google-calendar/connect`, `POST /google-calendar/sync`

## Permissões

- Admin gerencia usuários, procedimentos, categorias, POPs, disponibilidade, exceções, marca, galeria e Google Calendar.
- Profissional vê apenas a própria agenda e os clientes que atende, com histórico filtrado; não lista usuários nem consulta por telefone.
- Cliente vê apenas os próprios agendamentos e edita o próprio perfil.
- POPs, procedimentos e dados públicos do site podem ser lidos sem autenticação.

Detalhes em [docs/ACCESS.md](../docs/ACCESS.md).

## Segurança

- Senhas não existem; acesso por código OTP.
- Sessões JWT têm `jti` e são validadas no Redis.
- Rate limit usa Upstash Ratelimit REST quando configurado e fallback em memória em dev/test.
- CORS não aceita `*`; Helmet aplica cabeçalhos de segurança.
- SSL do Supabase valida o certificado; use `DB_SSL_CA_BASE64`.
- POPs aceitam apenas PDF até 4,5 MB; marca/galeria aceitam PNG/JPG/WebP.
- OTPs ainda aparecem no log do backend até a integração de WhatsApp/e-mail.

## Testes

```bash
npm test
npm run test:e2e
npm run test:e2e:cov
```

- Unitário: Jest.
- Integração: Jest + supertest.
- Validação externa complementar: repositório/suíte `pi-univesp-testes`.
