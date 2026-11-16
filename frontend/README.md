# Frontend — React + Vite

Aplicação web do PI-univesp. Uma única base atende múltiplas marcas por configuração e domínio, com Dayane e Karina como variantes atuais.

- Arquitetura geral: [../docs/architecture/overview.md](../docs/architecture/overview.md)
- Multi-site: [../docs/architecture/multi-site.md](../docs/architecture/multi-site.md)
- Variantes: [../docs/reference/variants.md](../docs/reference/variants.md)
- Known issues: [../docs/reference/known-issues.md](../docs/reference/known-issues.md)

## Stack real

- React + Vite + TypeScript transpilado
- React Router
- Tailwind CSS v4
- Componentes próprios no estilo shadcn/ui sobre Radix UI
- lucide-react
- sonner
- date-fns
- Vitest + Testing Library

> A UI em execução não usa Mantine. MUI e Emotion estão instalados, mas sem uso no código e são uma pendência de limpeza.

## Rotas por perfil

### Público

- `/`
- `/login`
- `/signup`
- `/agendar/:treatmentId`
- `/tratamentos`, `/tratamentos/:id`, `/sobre`, `/contato` → redirecionam para âncoras da home

### Cliente

- `/cliente/agendamentos`
- `/cliente/agendamentos/novo`
- `/cliente/novo` → redirect
- `/cliente/notificacoes` (rota existe, mas está oculta)
- `/cliente/perfil`

### Profissional e administração

- `/app/appointments`
- `/app/clients`
- `/app/procedures`
- `/app/availability`
- `/app/settings`
- `/app/employees`
- `/app/categories`
- `/app/notifications` (rota oculta)

## Providers e contextos

- `AuthProvider`: sessão, OTP, logout e perfil.
- `GoogleCalendarProvider`: status, conexão e sincronização.
- `BrandProvider`: identidade visual e contato.
- `GalleryProvider`: galeria pública e administração.
- `CategoriesProvider`: categorias.
- `ProceduresProvider`: procedimentos.
- `UsersProvider`: usuários e clientes.
- `AppointmentsProvider`: agendamentos e disponibilidade.

O `App` monta também o host do modal de OTP e o Toaster.

## Autenticação e OTP

- Login por telefone + código.
- Cadastro em duas etapas: e-mail e telefone.
- Recuperação: e-mail atual e novo telefone.
- Alteração de contato com código.
- Gate de confirmação de e-mail.

No modo demonstração atual:

- o backend retorna `demo_code`;
- o frontend abre um modal;
- o código pode ser copiado;
- há atalhos para Admin, Profissional e Cliente.

O modo demo não possui flag no frontend. A segurança depende do backend deixar de retornar `demo_code`.

## Variantes e multi-site

- Variantes ficam em `src/variants/<id>/`.
- O domínio registrado no manifesto tem prioridade.
- `VITE_CLIENTE` seleciona a variante em localhost/preview.
- `src/variants/settings.json` define a variante padrão.
- `npm run variants:validate` valida manifests, domínios, configuração e assets.
- `npm run variant:create -- <id>` cria uma nova variante.

Os configs de todas as variantes são emitidos no bundle. Isso não é usado como controle de acesso.

## Fluxo de agendamento

### Cliente

1. Resume procedimentos com disponibilidade.
2. Carrega datas disponíveis em janela de 60 dias.
3. Carrega horários por profissional.
4. Permite selecionar data e horário.
5. Confirma a criação do agendamento.

### Administração

- Cria agendamentos com cliente, procedimento, profissional, data e horário.
- Visualiza agenda por dia, semana, mês e lista.
- A agenda usa disponibilidade e exceções cadastradas.

## Serviços

- `api.ts`: base central para JSON, blobs, FormData e erros.
- `auth.ts`: login, cadastro, recuperação e logout.
- `otp.ts` + `otp-code.ts`: políticas e modal OTP.
- `users.ts`: usuários, validação, contatos e paginação.
- `procedures.ts`, `categories.ts`, `pops.ts`: catálogo e documentos.
- `schedules.ts`: agendamentos, disponibilidade, work schedules e exceções.
- `site.ts`: marca e galeria.
- `google-calendar.ts`: integração Google.
- `contact-change.ts`: confirmação de contato.

## Setup local

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

- Frontend: `http://localhost:5173`
- API local padrão: `http://localhost:3000`
- O proxy do Vite encaminha `/api/*`.
- `VITE_CLIENTE` é opcional em localhost.
- `VITE_API_BASE_URL` é obrigatória em produção.

## Variáveis

- `VITE_API_BASE_URL`
- `VITE_API_PROXY_TARGET`
- `VITE_CLIENTE`

Nenhuma variável `VITE_*` é secreta. Tudo é público no bundle.

## Scripts

```bash
npm run dev
npm test
npm run test:coverage
npm run build
npm run variants:validate
npm run variant:create -- <id>
npm run format
npm run format:check
```

## Testes

- Vitest + jsdom + Testing Library.
- Estado atual: 146 testes.
- Cobertura cobre parte dos serviços, contextos, utilidades, home, configurações e páginas principais.
- A cobertura não cobre atualmente todo o `src`.
- Não há typecheck, lint ou CI configurados.

## Limitações conhecidas do frontend

- Não possui `tsconfig.json`, typecheck nem lint.
- O bundle é único e grande; não há code splitting por rota.
- 42 dependências não estão no runtime real; MUI, Emotion e vários wrappers não são usados.
- 40 módulos de UI shadcn/Radix estão inalcançáveis.
- READMEs/documentos antigos citavam Mantine/MUI incorretamente.
- Admin sem vínculo profissional não acessa disponibilidade.
- Controles de marca e galeria aparecem para não-admin; o backend rejeita escritas.
- `/app/categories` e `/app/employees/:id` não têm gate visual de admin.
- Galeria vazia reidrata imagens padrão.
- `/cliente` não tem index route.
- Usuário autenticado não é redirecionado ao abrir `/login`.
- “Agendar agora” envia usuário autenticado para `/login`.
- Rotas de detalhe de cliente usam semânticas diferentes para admin e profissional.
- Tailwind v4: overlay do POP usa `bg-opacity-50`, removido na versão 4.
- Notificações estão ocultas por feature flag.
- Todos os configs de variantes são emitidos no bundle.
- O contato da Karina ainda contém dados herdados da Dayane.
- Sem ErrorBoundary, 404 customizado ou Suspense.
- Imagens grandes e sem otimização.
- Acessibilidade incompleta em overlays e controles somente-ícone.

Lista completa: [../docs/reference/known-issues.md](../docs/reference/known-issues.md).
