# Scripts

## Backend

| Script                 | Função                  |
| ---------------------- | ----------------------- |
| `npm run start:dev`    | backend local com watch |
| `npm run start:prod`   | executa `dist/main`     |
| `npm run build`        | compila NestJS          |
| `npm test`             | testes unitários        |
| `npm run test:e2e`     | testes e2e              |
| `npm run test:e2e:cov` | e2e com cobertura       |
| `npm run format`       | Prettier write          |
| `npm run lint`         | ESLint com `--fix`      |
| `npm run seed:admin`   | admin inicial           |
| `npm run seed:demo`    | dataset de demonstração |
| `npm run migrate:*`    | scripts de migração     |

## Migrações

- `migrate:schedule-exception-name`
- `migrate:google-event-link`
- `migrate:categories`
- `migrate:procedure-professionals`
- `migrate:procedure-status`
- `migrate:brand-gallery`
- `migrate:confirmed-contacts`

## Frontend

| Script                           | Função            |
| -------------------------------- | ----------------- |
| `npm run dev`                    | Vite local        |
| `npm run build`                  | build de produção |
| `npm test`                       | Vitest            |
| `npm run test:coverage`          | cobertura         |
| `npm run variants:validate`      | valida variantes  |
| `npm run variant:create -- <id>` | cria variante     |
| `npm run format`                 | Prettier write    |
| `npm run format:check`           | Prettier check    |

## Ausências atuais

- frontend sem `typecheck`;
- frontend sem lint;
- backend sem `format:check`;
- backend sem `lint:check`;
- sem script raiz;
- sem CI.
