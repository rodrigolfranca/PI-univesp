# PI-univesp

Sistema de agendamentos para profissionais de estética, com frontend React/Vite e backend NestJS.

## Projetos

- [Frontend](frontend/README.md)
- [Backend](backend/README.md)
- [Arquitetura multi-site](docs/MULTISITE.md)
- [Deploy: Vercel + Supabase + Upstash](docs/DEPLOY.md)
- [Níveis de acesso](docs/ACCESS.md)

## Requisitos

- [Node.js 22](https://nodejs.org/en)
- [Git](https://git-scm.com/install/windows)
- [GitHub CLI](https://cli.github.com/) opcional
- [Docker](https://www.docker.com/) para o banco e o Redis locais
- [VS Code](https://code.visualstudio.com/) opcional

## Testes e cobertura

```bash
cd backend
npm test
npm run test:e2e
npm run test:e2e:cov

cd ../frontend
npm test
npm run test:coverage
```

- Backend unitário: Jest.
- Backend integração: Jest + suíte externa em `pi-univesp-testes`.
- Frontend: Vitest + Testing Library.
- A cobertura do frontend cobre serviços, utilitários de agenda, contextos de autenticação/usuários/marca/galeria/procedimentos/categorias/agendamentos, a home, Settings, agenda e páginas do cliente, com limites mínimos de 90% para statements/lines e 80% para branches/functions.
- A cobertura de integração do backend usa piso global de 65% statements/lines, 45% branches e 55% functions; regras críticas de autenticação, contato e rate limit também têm testes unitários.
