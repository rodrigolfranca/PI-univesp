# Primeiros passos

Guia para rodar o backend, o frontend e os dados de demonstração localmente.

## Requisitos

- Node.js 22 ou superior
- npm
- Docker e Docker Compose
- Git

## Backend

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

O backend carrega `.env.dev` com `NODE_ENV=dev`.

O `.env.example` contém placeholders. Antes de subir o backend, substitua as credenciais e gere `GOOGLE_TOKEN_ENCRYPTION_KEY` com exatamente 64 caracteres hexadecimais. Sem isso, a validação de ambiente rejeita a inicialização.

## Frontend

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

- Frontend: `http://localhost:5173`
- Proxy local: `/api` → `http://localhost:3000`

## Dados de demonstração

Com o schema local já criado:

```bash
cd backend
SITE_ID=dayane DB_NAME=univesp NODE_ENV=dev npm run seed:demo
```

O seed cria:

- 1 admin;
- 3 profissionais;
- 6 clientes;
- 5 categorias de negócio, além de `Geral`;
- 8 procedimentos;
- vínculos procedimento-profissional;
- horários e exceções;
- 12 agendamentos.

As contas e o fluxo de OTP estão em [Modo demonstração](reference/demo-mode.md).

## Segunda instância local

Para testar Dayane e Karina ao mesmo tempo, use bancos e portas diferentes:

```bash
# Dayane
SITE_ID=dayane DB_NAME=univesp_dayane DB_SYNC=false PORT=3000 NODE_ENV=dev npm run start:dev

# Karina
SITE_ID=karina DB_NAME=univesp_karina DB_SYNC=false PORT=3001 NODE_ENV=dev npm run start:dev
```

No frontend:

```bash
VITE_CLIENTE=dayane VITE_API_PROXY_TARGET=http://localhost:3000 npm run dev -- --port 5173
VITE_CLIENTE=karina VITE_API_PROXY_TARGET=http://localhost:3001 npm run dev -- --port 5174
```

## Ordem recomendada

1. Subir Postgres e Redis.
2. Subir backend.
3. Rodar seed demo.
4. Subir frontend.
5. Abrir `/login`.
6. Usar os atalhos demo.
7. Solicitar código e copiar no modal.

## Problemas comuns

### Telefone não cadastrado

O backend pode estar apontando para outro banco. Verifique `DB_NAME` e `SITE_ID`.

### Erro de conexão

Confirme que Postgres e Redis estão ativos:

```bash
docker ps
```

### OTP não aparece

Confirme se o frontend e backend estão na mesma instância e se a resposta da API contém `demo_code`.

### Mudanças não aparecem

Reinicie o Vite e confirme a variante em `VITE_CLIENTE`.

## Próximos documentos

- [Arquitetura](architecture/overview.md)
- [Configuração](reference/configuration.md)
- [Testes](development/testing.md)
- [Known issues](reference/known-issues.md)
