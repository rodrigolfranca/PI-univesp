# Ambientes

## Matriz

| Ambiente        | Frontend       | Backend        | Banco              | Redis                 | Uso             |
| --------------- | -------------- | -------------- | ------------------ | --------------------- | --------------- |
| Desenvolvimento | Vite local     | NestJS local   | Postgres Docker    | Redis Docker          | desenvolvimento |
| Teste           | —              | Jest local     | Postgres Docker    | Redis Docker          | unit/e2e        |
| Preview         | Vercel preview | Vercel preview | Supabase de marca  | Upstash compartilhado | validação       |
| Produção        | Vercel         | Vercel         | Supabase por marca | Upstash compartilhado | demonstração    |

## Desenvolvimento

Arquivos:

- `backend/.env.dev`
- `frontend/.env.local`

Características:

- `DB_SYNC=true` por padrão em `NODE_ENV=dev`;
- Redis local;
- OTP exibido em modal;
- variante por `VITE_CLIENTE`.

## Teste

- `NODE_ENV=test`;
- `.env.test`;
- e2e usa Postgres e Redis reais;
- schema pode ser criado com `DB_SYNC=true`.

## Preview

- cada marca deve usar seu próprio backend;
- `VITE_CLIENTE` pode selecionar a variante;
- cuidado com Upstash compartilhado e `SITE_ID`;
- não usar dados reais.

## Produção

- `DB_SYNC=false`;
- `SITE_ID` obrigatório;
- CORS explícito;
- Google OAuth configurado;
- migrações rodadas manualmente;
- deploy via Vercel CLI.

## Segredos

Nunca versionar:

- `.env.dev`;
- `.env.prod`;
- `.env.prod.dayane`;
- `.env.prod.karina`;
- tokens Vercel/Supabase;
- service role do Supabase;
- refresh tokens Google;
- JWT secrets.

## Variáveis por ambiente

| Variável       | Dev       | Teste     | Produção                       |
| -------------- | --------- | --------- | ------------------------------ |
| `DB_SYNC`      | `true`    | `true`    | `false`                        |
| `SITE_ID`      | opcional  | opcional  | obrigatório                    |
| `CORS_ORIGINS` | localhost | localhost | domínio oficial                |
| `VITE_CLIENTE` | opcional  | —         | opcional se domínio registrado |
| OTP            | modal     | mocks     | modal no modo demo atual       |

## Limitações

- não há staging formal;
- previews não têm banco isolado por PR;
- projetos Vercel não estão vinculados ao Git;
- não há CI para validar envs.
