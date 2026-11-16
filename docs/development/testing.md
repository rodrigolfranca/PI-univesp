# Testes

## Backend

```bash
cd backend
npm test
npm run test:e2e
npm run test:e2e:cov
```

Estado atual:

- 32 testes unitários;
- 52 testes e2e;
- e2e exige PostgreSQL e Redis reais;
- schema de teste pode usar `DB_SYNC=true`.

## Frontend

```bash
cd frontend
npm test
npm run test:coverage
npm run variants:validate
```

Estado atual:

- 146 testes;
- Vitest + jsdom + Testing Library;
- variantes validadas.

## Cobertura

Backend:

- e2e com thresholds de 65% statements/lines, 45% branches e 55% functions;
- unitários sem threshold global.

Frontend:

- thresholds de 90% statements/lines e 80% branches/functions;
- cobertura limitada aos arquivos incluídos no `vitest.config.ts`.

## Lacunas

- sem CI;
- sem typecheck no frontend;
- sem testes de rotas/guards;
- sem testes de seleção de variantes;
- sem teste de admin sem `professionalId`;
- sem teste de galeria vazia;
- sem E2E de navegador;
- sem accessibility/Lighthouse.

## Antes de abrir PR

```bash
# backend
npm run build
npm test
npm run test:e2e

# frontend
npm test
npm run variants:validate
npm run build
npm run format:check
```

## Próximos passos

- CI com services de Postgres/Redis;
- cobertura global no backend;
- Playwright smoke;
- axe;
- testes de autorização por rota.
