# Arquitetura multi-site

O projeto atende duas marcas com contas e dados separados, usando a mesma base de código e as mesmas contas de infraestrutura.

## Topologia

| Recurso                     | Quantidade    | Uso                                                    |
| --------------------------- | ------------- | ------------------------------------------------------ |
| Projetos frontend na Vercel | 2             | `dayane-frontend`, `karina-frontend`                   |
| Projetos backend na Vercel  | 2             | `dayane-backend`, `karina-backend`                     |
| Projetos Supabase Free      | 2             | banco isolado por marca                                |
| Banco Upstash Free          | 1             | cache, OTP, sessões e rate limit com prefixo `SITE_ID` |
| Bucket Supabase Storage     | 1 por projeto | logo e galeria da marca                                |

Cada frontend aponta para o próprio backend via `VITE_API_BASE_URL`. Cada backend usa o próprio banco Supabase. O Upstash é compartilhado para caber no plano Free, então todas as chaves Redis recebem o prefixo `SITE_ID`.

## Domínios

- `dayane-di-giovanni.vercel.app` → frontend Dayane → backend Dayane.
- `karina-alexisch.vercel.app` → frontend Karina → backend Karina.

Domínios cadastrados nos manifestos dos variantes prevalecem sobre `VITE_CLIENTE`. Use `VITE_CLIENTE=dayane` ou `VITE_CLIENTE=karina` apenas em previews e desenvolvimento.

## Variáveis por backend

Cada projeto backend precisa de valores próprios para:

- `SITE_ID` (`dayane` ou `karina`);
- `DB_*`, com o Supabase correspondente;
- `SUPABASE_*`, com o projeto e bucket correspondentes;
- `CORS_ORIGINS`, com o domínio do frontend correspondente;
- `GOOGLE_REDIRECT_URI`, com a URL do backend correspondente;
- `JWT_SECRET`, `GOOGLE_TOKEN_ENCRYPTION_KEY` e demais segredos.

`REDIS_URL`, `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` podem ser os mesmos nos dois backends. Não compartilhe `SITE_ID` entre marcas.

## Chaves Redis prefixadas

Todas as chaves usam `SITE_ID` como prefixo:

- `site:auth_code:*`
- `site:recovery_code:*`
- `site:user:*`
- `site:contact_change:*`
- `site:google_oauth_state:*`
- `site:session:*`
- `site:ratelimit:*`

Isso evita colisão de códigos, sessões e cache entre as marcas.

## Supabase Storage

Crie um bucket público `site-images` em cada projeto Supabase. O backend grava logo e galeria usando a service role key. O frontend consome apenas as URLs públicas retornadas pela API.

Se as variáveis `SUPABASE_*` não estiverem configuradas, o backend usa data URL como fallback local. Não use esse fallback como solução de produção.

## Ordem de deploy

Para cada marca:

1. Criar o projeto Supabase e guardar as credenciais do pooler.
2. Criar o bucket `site-images`.
3. Preencher `.env.prod` com `DB_SYNC=true` e rodar as migrações e o seed localmente.
4. Alterar `DB_SYNC=false`.
5. Publicar o backend na Vercel.
6. Publicar o frontend apontando `VITE_API_BASE_URL` para o backend.
7. Ajustar `CORS_ORIGINS` e `GOOGLE_REDIRECT_URI` com os domínios finais.
8. Validar login, marca, galeria, agenda e Google Calendar.

As migrações obrigatórias estão listadas em `docs/DEPLOY.md`.

## Limites dos planos Free

- **Vercel Hobby:** uso não comercial e restrição para repositórios de organização GitHub.
- **Supabase Free:** dois projetos ativos; projetos ociosos podem ser pausados.
- **Upstash Free:** 250 MB e 500 mil comandos por mês; um único banco compartilhado.
- **Google OAuth:** use um client com os dois redirect URIs ou um client por backend.
