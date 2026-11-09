# Deploy: Vercel + Supabase + Upstash

Para a topologia das duas marcas, isolamento de dados e ordem de deploy por variante, comece por [Arquitetura multi-site](MULTISITE.md).

Arquitetura usada por marca:

- **Frontend:** projeto Vercel com root directory `frontend`.
- **Backend:** projeto Vercel com root directory `backend`, usando o suporte zero-config a NestJS.
- **Banco:** PostgreSQL do Supabase via pooler.
- **Storage:** bucket público do Supabase para logo e galeria.
- **Redis:** Upstash Free via conexão TCP com TLS (`rediss://`) e REST para rate limit.

O frontend e o backend são projetos separados. O frontend chama a API diretamente pela URL pública do backend, e o backend libera a origem do frontend por CORS.

## Fonte de verdade e deploy

O repositório `rodrigolfranca/PI-univesp`, na branch `main`, é a única fonte de verdade do que pode ir para a infraestrutura.

- Os projetos Vercel devem estar conectados ao repositório pela integração Git nativa e publicar apenas a partir da `main`.
- Não execute `vercel --prod` a partir de uma árvore local. O deploy deve registrar `source: git`, o SHA da `main` e `gitDirty` ausente ou `0`.
- Antes de publicar, confirme que `git status` está limpo e que `HEAD` é igual a `origin/main`.
- Branches novas de trabalho são mantidas por 14 dias após o merge para rollback e depois podem ser removidas manualmente. A exclusão automática de branches no GitHub deve permanecer desativada.

## 1. Pré-requisitos

- Conta na Vercel, no Supabase e no Upstash.
- Repositório no GitHub.
- Node.js 22 para rodar o seed localmente.
- Acesso ao painel do Google Cloud para configurar o OAuth.

A Vercel Hobby é gratuita apenas para uso não comercial e não permite conectar um projeto a um repositório de organização GitHub. Para uso comercial ou repositório de organização, será necessário um plano pago.

## 2. Supabase

1. Crie um projeto no Supabase na região mais próxima de São Paulo.
2. Guarde a senha do banco definida na criação.
3. Abra **Connect** e use as credenciais do pooler.

### Conexões

O runtime da Vercel usa o **transaction pooler**:

```env
DB_HOST=aws-0-<regiao>.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<senha-do-banco>
DB_NAME=postgres
DB_SSL=true
```

O bootstrap do schema e o seed usam o **session pooler**:

```env
DB_HOST=aws-0-<regiao>.pooler.supabase.com
DB_PORT=5432
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<senha-do-banco>
DB_NAME=postgres
DB_SSL=true
```

Evite usar a conexão direta `db.<project-ref>.supabase.co` na Vercel, pois ela pode exigir IPv6. O pooler funciona com IPv4.

### Criar o schema e o admin

O backend não deve rodar `sync` em produção. Crie o schema uma única vez, localmente, usando o session pooler:

```bash
cd backend
cp .env.example .env.prod
```

Preencha `.env.prod` com:

- `NODE_ENV=prod`
- credenciais do **session pooler** (`DB_PORT=5432`)
- `DB_SSL=true`
- `DB_SSL_CA_BASE64` com o certificado CA do Supabase em base64
- `DB_SYNC=true`
- demais variáveis obrigatórias, incluindo JWT (mínimo 64 caracteres) e Google
- `SEED_ADMIN_NAME`, `SEED_ADMIN_PHONE` e `SEED_ADMIN_EMAIL`

Antes do seed, rode as migrações idempotentes:

```bash
NODE_ENV=prod npm run migrate:schedule-exception-name
NODE_ENV=prod npm run migrate:google-event-link
NODE_ENV=prod npm run migrate:categories
NODE_ENV=prod npm run migrate:procedure-status
NODE_ENV=prod npm run migrate:brand-gallery
NODE_ENV=prod npm run seed:admin
```

Esse comando cria as tabelas e garante o usuário administrador. Depois do seed, altere `DB_SYNC=false` no `.env.prod` para evitar novas sincronizações acidentais.

Na Vercel, `DB_SYNC` deve permanecer `false`.

### Supabase Storage

Crie um bucket público chamado `site-images` e use a service role key apenas no backend. O backend envia logo e galeria para esse bucket, mas mantém fallback em data URL quando as variáveis `SUPABASE_*` não estão configuradas (útil em desenvolvimento).

## 3. Upstash

1. Crie um banco Redis no Upstash, com TLS habilitado.
2. Copie a URL de conexão TCP no formato:

```env
REDIS_URL=rediss://default:<senha>@<host>:6379
```

3. Use essa URL no backend.

Se estiver usando a integração do Upstash pelo Marketplace da Vercel, ela pode criar apenas variáveis REST (`UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`). O backend usa TCP, então adicione `REDIS_URL` manualmente nas variáveis do projeto.

Alternativa sem URL:

```env
REDIS_HOST=<host>
REDIS_PORT=6379
REDIS_PASSWORD=<senha>
REDIS_TLS=true
```

O plano gratuito do Upstash oferece 250 MB e 500 mil comandos por mês. O uso atual de códigos OTP e cache de usuário cabe nesse limite.

## 4. Backend na Vercel

1. Importe o repositório na Vercel.
2. Configure **Root Directory** como `backend`.
3. Mantenha o preset NestJS detectado automaticamente.
4. Use `npm run build` como build command.
5. Não crie `api/index.ts`; o projeto mantém `src/main.ts` e `app.listen`.
6. A região fica definida em `backend/vercel.json` como `gru1`.

### Variáveis do backend

| Variável                      | Valor                                                   |
| ----------------------------- | ------------------------------------------------------- |
| `NODE_ENV`                    | `production`                                            |
| `DB_HOST`                     | host do transaction pooler                              |
| `DB_PORT`                     | `6543`                                                  |
| `DB_USERNAME`                 | `postgres.<project-ref>`                                |
| `DB_PASSWORD`                 | senha do Supabase                                       |
| `DB_NAME`                     | `postgres`                                              |
| `DB_SSL`                      | `true`                                                  |
| `DB_SSL_CA_BASE64`            | CA do Supabase codificada em base64                     |
| `DB_SYNC`                     | `false`                                                 |
| `REDIS_URL`                   | `rediss://default:<senha>@<host>:6379`                  |
| `UPSTASH_REDIS_REST_URL`      | URL REST do mesmo banco Upstash                         |
| `UPSTASH_REDIS_REST_TOKEN`    | token REST do mesmo banco Upstash                       |
| `JWT_SECRET`                  | segredo aleatório com pelo menos 64 caracteres          |
| `GOOGLE_CLIENT_ID`            | credencial do Google Cloud                              |
| `GOOGLE_CLIENT_SECRET`        | credencial do Google Cloud                              |
| `GOOGLE_REDIRECT_URI`         | `https://<backend>.vercel.app/google-calendar/callback` |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | 64 caracteres hexadecimais                              |
| `GOOGLE_CALENDAR_TIMEZONE`    | `America/Sao_Paulo`                                     |
| `AUTH_THROTTLE_TTL_MS`        | `60000`                                                 |
| `AUTH_THROTTLE_LIMIT`         | `10`                                                    |
| `CORS_ORIGINS`                | `https://<frontend>.vercel.app` (sem `*`)               |
| `TRUST_PROXY`                 | `1` na Vercel                                           |
| `SITE_ID`                     | identificador curto da variante (`dayane`, `karina`)    |
| `SUPABASE_URL`                | `https://<project-ref>.supabase.co`                     |
| `SUPABASE_SERVICE_ROLE_KEY`   | service role key do Supabase                            |
| `SUPABASE_STORAGE_BUCKET`     | bucket público, por exemplo `site-images`               |

Não defina `PORT`; a Vercel fornece a porta usada pela função.

Depois do deploy, valide:

```bash
curl https://<backend>.vercel.app/health
```

A resposta esperada é:

```json
{ "status": "ok" }
```

O Swagger fica em `https://<backend>.vercel.app/documentation`.

No Google Cloud, cadastre exatamente a mesma `GOOGLE_REDIRECT_URI` nas credenciais OAuth. Depois da autorização, o callback do backend redireciona para a primeira origem válida de `CORS_ORIGINS`.

## 5. Frontend na Vercel

1. Importe o mesmo repositório em outro projeto Vercel.
2. Configure **Root Directory** como `frontend`.
3. Mantenha o preset Vite, com `npm run build` e saída `dist`.
4. Configure a variável:

```env
VITE_API_BASE_URL=https://<backend>.vercel.app
```

Não use `/api` no final e não use barra final. O frontend acrescenta os caminhos da API, como `/auth/request-code`.

Variáveis `VITE_*` são públicas no bundle do navegador. Nunca coloque segredos nelas.

O `VITE_CLIENTE` é opcional e serve para previews ou seleção de variante. Domínios cadastrados nos manifestos prevalecem sobre essa variável.

Como o Vite embute as variáveis em tempo de build, qualquer alteração em `VITE_API_BASE_URL` exige um novo deploy do frontend.

## 6. Ordem recomendada

1. Criar Supabase e guardar as credenciais.
2. Criar Upstash e copiar `REDIS_URL`.
3. Criar o schema e o admin localmente com o session pooler.
4. Configurar e publicar o backend na Vercel com o transaction pooler e `DB_SYNC=false`.
5. Testar `/health`.
6. Configurar e publicar o frontend com `VITE_API_BASE_URL`.
7. Atualizar `CORS_ORIGINS` no backend com o domínio final do frontend.
8. Fazer novo deploy do backend depois de alterar variáveis.
9. Testar o fluxo de login no frontend.

## 7. Validação

Teste o CORS a partir da origem do frontend:

```bash
curl -i -X OPTIONS https://<backend>.vercel.app/auth/request-code \
  -H "Origin: https://<frontend>.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

A resposta deve incluir o cabeçalho `Access-Control-Allow-Origin` com a origem do frontend.

No frontend, valide:

- carregamento das variantes;
- cadastro de cliente;
- solicitação e validação do código de login;
- restauração da sessão após recarregar a página;
- listagem e edição de usuários com uma conta admin;
- cadastro de procedimento, POP, categoria e disponibilidade com uma conta admin;
- criação de agendamento pelo admin e pelo cliente;
- conexão, desconexão e sincronização da Google Agenda;
- alteração de telefone/e-mail com código enviado ao novo contato;
- listagem dos clientes atendidos e histórico no painel do profissional;
- detalhes públicos do procedimento e download de POPs antes do login.

## 8. Limitações e pendências

- **OTP e códigos de alteração de contato ainda são apenas logados.** O backend não envia WhatsApp nem e-mail. Para testar, leia o código nos Runtime Logs da Vercel. Para usuários reais, integre Z-API e um provedor de e-mail e remova o log do código em produção.
- **Recuperação ainda usa um único código enviado ao novo telefone.** O fluxo planejado é confirmar primeiro o e-mail e depois o novo telefone; até lá, mantenha o throttle.
- **POPs públicos:** listagem e download são públicos por decisão de produto. Não coloque documentos internos em POPs públicos.
- **Throttle distribuído:** auth, consulta por telefone e alteração de contato usam Upstash Ratelimit REST com prefixo `SITE_ID`. Sem as variáveis `UPSTASH_REDIS_REST_*`, o backend cai para limite em memória por instância (adequado apenas para desenvolvimento/teste).
- **Sessões JWT:** todo token de acesso recebe um `jti` único e só é aceito enquanto a sessão existir no Redis. `POST /auth/logout` revoga a sessão atual. O prefixo `SITE_ID` isola as chaves Redis mesmo usando o mesmo banco Upstash.
- **Cabeçalhos e CORS:** Helmet aplica cabeçalhos de segurança. `CORS_ORIGINS` deve listar origens explícitas; `*` é rejeitado.
- **Uploads:** POPs aceitam apenas PDF de até 4,5 MB; logo e galeria aceitam PNG/JPG/WebP com limites próprios.
- **Payload máximo da Vercel:** 4,5 MB por requisição. PDFs de POP maiores precisam ser enviados ao Supabase Storage.
- **Duração máxima da função:** 300 segundos na Hobby.
- **Supabase Free:** projetos podem ser pausados por inatividade.
- **Upstash Free:** 250 MB e 500 mil comandos por mês.
- **Cold start:** cada nova instância inicializa NestJS, Sequelize e Redis. O schema não deve ser sincronizado nesse bootstrap.
- **Backend sem migrações versionadas.** O schema inicial usa `DB_SYNC=true` uma única vez. Mudanças futuras de modelo precisam de migração controlada.
- **POPs ficam no Postgres.** Logo e galeria usam Supabase Storage; para volume maior de POPs, migrar também para Storage.
- **Vercel Hobby:** uso não comercial e restrição para repositórios de organização GitHub.
- **Matriz de acesso:** consulte `docs/ACCESS.md`.

## 9. Segurança

- Não comite `.env.prod`, `.env.local` ou credenciais.
- Rotacione a senha do Supabase, o token do Upstash, o `JWT_SECRET` e o segredo do Google se forem expostos.
- Mantenha `CORS_ORIGINS` restrito aos domínios reais. Evite `*` em produção.
- Não exponha códigos OTP em logs depois da integração real de envio.
- Mantenha `GOOGLE_TOKEN_ENCRYPTION_KEY` com 64 caracteres hexadecimais e fora do repositório.
