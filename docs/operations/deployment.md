# Deployment

## Estado atual

Infraestrutura:

- frontend na Vercel;
- backend na Vercel;
- PostgreSQL e Storage no Supabase;
- Redis no Upstash;
- OAuth no Google Cloud.

URLs de produção:

- Dayane frontend: `https://dayane-di-giovanni-estetica.vercel.app`
- Dayane backend: `https://dayane-backend.vercel.app`
- Karina frontend: `https://karina-alexitsch-estudio.vercel.app`
- Karina backend: `https://karina-alexitsch-backend.vercel.app`

Os projetos Vercel são implantados atualmente via Vercel CLI. Diferente do que versões antigas da documentação afirmavam, os projetos não estão vinculados ao GitHub pela integração Git nativa.

## Pré-requisitos

- acesso ao projeto Vercel;
- projeto Supabase por marca;
- Redis Upstash compartilhado;
- credenciais Google OAuth;
- `.env` de produção de cada marca.

## Supabase

Use o session pooler para migrações e seeds e o transaction pooler no runtime da Vercel.

Runtime:

```env
DB_PORT=6543
```

Migrações/seeds:

```env
DB_PORT=5432
```

Configure `DB_SYNC=false` no runtime.

## Migrações e seeds

Executar por banco, na ordem:

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

- `seed:demo` é apenas para demonstração.
- As migrações atuais não possuem ledger/rollback.
- Ver [Migrações](migrations.md).

## Variáveis do backend

- `NODE_ENV=production`
- `DB_*`, incluindo SSL
- `DB_SSL_CA_BASE64`
- `DB_SYNC=false`
- `REDIS_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `JWT_SECRET`
- `GOOGLE_*`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`
- `GOOGLE_CALENDAR_TIMEZONE`
- `CORS_ORIGINS`
- `TRUST_PROXY=1`
- `SITE_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `AUTH_THROTTLE_TTL_MS`
- `AUTH_THROTTLE_LIMIT`

Referência completa: [Configuração](../reference/configuration.md).

## Variáveis do frontend

```env
VITE_API_BASE_URL=https://<backend>.vercel.app
```

- sem `/api`;
- sem barra final;
- `VITE_CLIENTE` é opcional em produção quando o domínio está no manifesto.

## Ordem de deploy

1. Confirmar `main` limpa e sincronizada.
2. Fazer backup do banco.
3. Rodar migrações.
4. Rodar seed, quando aplicável.
5. Publicar backend.
6. Validar `/health`.
7. Publicar frontend.
8. Validar CORS.
9. Validar login com modal OTP.
10. Validar os três perfis.

## Comandos atuais

Backend:

```bash
vercel deploy --prod --project <backend>
```

Frontend:

```bash
vercel deploy --prod --project <frontend>
```

Recomenda-se registrar SHA, `gitDirty=0` e origem do deploy.

## Smoke test

```bash
curl https://<backend>.vercel.app/health
```

Esperado:

```json
{ "status": "ok" }
```

CORS:

```bash
curl -i -X OPTIONS https://<backend>.vercel.app/auth/request-code \
  -H "Origin: https://<frontend>.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

Validar `access-control-allow-origin`.

## Google Cloud

Redirect URIs:

```text
http://localhost:3000/google-calendar/callback
https://dayane-backend.vercel.app/google-calendar/callback
https://karina-alexitsch-backend.vercel.app/google-calendar/callback
```

Cada admin conecta a própria conta pela interface.

## Limitações

- deploy não é Git-native;
- sem staging formal;
- sem smoke automatizado;
- sem CI;
- sem rollback de migração;
- sem backups automatizados documentados.
