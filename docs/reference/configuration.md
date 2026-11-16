# Configuração

## Backend

| Variável                      | Obrigatória     | Observação                    |
| ----------------------------- | --------------- | ----------------------------- |
| `NODE_ENV`                    | Sim             | `dev`, `prod`, `test`         |
| `PORT`                        | Não             | Padrão 3000                   |
| `DB_HOST`                     | Sim             | Supabase pooler               |
| `DB_PORT`                     | Sim             | 5432 migrações, 6543 runtime  |
| `DB_USERNAME`                 | Sim             | usuário do pooler             |
| `DB_PASSWORD`                 | Sim             | senha do banco                |
| `DB_NAME`                     | Sim             | normalmente `postgres`        |
| `DB_SSL`                      | Não             | padrão produção: true         |
| `DB_SSL_CA_BASE64`            | Não             | CA em base64                  |
| `DB_SYNC`                     | Não             | false em produção             |
| `REDIS_URL`                   | Não             | preferencial                  |
| `REDIS_HOST`                  | Condicional     | se sem URL                    |
| `REDIS_PORT`                  | Condicional     | se sem URL                    |
| `REDIS_PASSWORD`              | Não             | Redis local/gerenciado        |
| `REDIS_TLS`                   | Não             | TLS do Redis                  |
| `UPSTASH_REDIS_REST_URL`      | Não             | rate limit REST               |
| `UPSTASH_REDIS_REST_TOKEN`    | Não             | rate limit REST               |
| `JWT_SECRET`                  | Sim             | mínimo 64 caracteres          |
| `GOOGLE_CLIENT_ID`            | Sim             | OAuth                         |
| `GOOGLE_CLIENT_SECRET`        | Sim             | OAuth                         |
| `GOOGLE_REDIRECT_URI`         | Sim             | callback do backend           |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | Sim             | 64 hex                        |
| `GOOGLE_CALENDAR_TIMEZONE`    | Não             | padrão America/Sao_Paulo      |
| `AUTH_THROTTLE_TTL_MS`        | Não             | padrão 60000                  |
| `AUTH_THROTTLE_LIMIT`         | Não             | padrão 10                     |
| `CORS_ORIGINS`                | Recomendado     | origens separadas por vírgula |
| `TRUST_PROXY`                 | Não             | 1 na Vercel                   |
| `SITE_ID`                     | Sim em produção | `dayane` ou `karina`          |
| `SUPABASE_URL`                | Recomendado     | Storage                       |
| `SUPABASE_SERVICE_ROLE_KEY`   | Recomendado     | service role                  |
| `SUPABASE_STORAGE_BUCKET`     | Recomendado     | `site-images`                 |
| `SEED_ADMIN_*`                | Seeds           | nome, telefone, e-mail        |

## Frontend

| Variável                | Obrigatória | Observação                 |
| ----------------------- | ----------- | -------------------------- |
| `VITE_API_BASE_URL`     | Produção    | URL do backend, sem `/api` |
| `VITE_API_PROXY_TARGET` | Dev         | alvo do proxy              |
| `VITE_CLIENTE`          | Não         | variante em local/preview  |

## Observações

- `VITE_*` é público no bundle.
- Nunca usar segredo em variável `VITE_*`.
- `SITE_ID` não é obrigatório fora de produção.
- CORS sem `*`.
- `DB_SYNC=false` no runtime.
- `SUPABASE_*` ausente ativa fallback de data URL.
- `.env.example` possui placeholders; revise antes de usar.
