# Setup local

## Requisitos

- Node.js 22+
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

Verificar:

- `http://localhost:3000/health`
- `http://localhost:3000/documentation`

## Frontend

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

Verificar:

- `http://localhost:5173`

## Seed demo

```bash
cd backend
SITE_ID=dayane DB_NAME=univesp NODE_ENV=dev npm run seed:demo
```

## Comandos úteis

```bash
docker ps
docker compose --env-file=.env.dev stop
npm test
npm run build
npm run format:check
```

## Estrutura de banco

- `DB_SYNC=true` cria schema no desenvolvimento.
- Não usar `DB_SYNC=true` em produção.
- Para múltiplas marcas locais, usar bancos separados.

## Troubleshooting

- Telefone não cadastrado: banco ou `SITE_ID` incorreto.
- Erro de conexão: Docker parado.
- Modal OTP não abre: resposta sem `demo_code` ou frontend em outra instância.
- CORS: usar proxy do Vite em desenvolvimento.

## Documentos relacionados

- [Primeiros passos](../getting-started.md)
- [Configuração](../reference/configuration.md)
- [Testes](testing.md)
