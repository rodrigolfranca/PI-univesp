# Known issues

Lista técnica de problemas conhecidos, riscos e pendências. Os itens abaixo refletem o estado atual da `main` e não representam correções já aplicadas.

Status possíveis:

- **Aberto:** comportamento atual conhecido.
- **Em avaliação:** depende de decisão de produto/provedor.
- **Planejado:** correção prevista para etapa futura.

## P0 — Segurança e bloqueios

### KI-001 — `demo_code` sem flag de ambiente

- **Status:** Aberto.
- **Impacto:** qualquer pessoa com um telefone cadastrado obtém o OTP pela resposta da API.
- **Evidência:** `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/users/users.service.ts`.
- **Correção esperada:** flag de modo demo com default false; remover `demo_code` em produção.

### KI-002 — Enumeração de contas

- **Status:** Aberto.
- **Impacto:** telefone desconhecido retorna 404 e revela existência de conta.
- **Evidência:** `AuthService.requestCode`, `AuthService.recoveryRequestEmailCode`.
- **Correção esperada:** resposta genérica e consistente.

### KI-003 — CORS sem `PUT`

- **Status:** Aberto.
- **Impacto:** atualização de marca via `PUT /site/brand` falha no navegador em produção.
- **Evidência:** `backend/src/main.ts`.
- **Correção esperada:** incluir `PUT` nos métodos permitidos.

### KI-004 — Disponibilidade inacessível para admin sem vínculo profissional

- **Status:** Aberto.
- **Impacto:** admin não profissional não vê o menu nem consegue usar a página de disponibilidade.
- **Evidência:** `frontend/src/app/components/RootLayout.tsx`, `frontend/src/app/pages/AvailabilityPage.tsx`.
- **Correção esperada:** permitir admin sem `professionalId` e exigir seleção de profissional.

### KI-005 — Work schedules sem proteção administrativa completa

- **Status:** Aberto.
- **Impacto:** controller usa apenas `AuthGuard`; a proteção de escopo fica no service.
- **Evidência:** `backend/src/modules/schedules/controllers/work-schedule.controller.ts`.
- **Correção esperada:** guard explícito e testes de acesso por perfil.

## P1 — Correção funcional e manutenção

### KI-006 — Slots não respeitam duração do procedimento

- **Status:** Aberto.
- **Impacto:** a UI pode mostrar horário que o backend rejeita ao confirmar.
- **Evidência:** `work-schedules.service.ts`, `schedules.service.ts`.
- **Correção esperada:** gerar slots considerando `duration_minutes` e `triagem_minutes`.

### KI-007 — Sem CI, typecheck e branch protection

- **Status:** Planejado.
- **Impacto:** regressões e erros de tipo podem chegar à `main`.
- **Evidência:** ausência de `.github/workflows`, `frontend/tsconfig.json` e proteção de branch.
- **Correção esperada:** CI, typecheck, lint, branch protection e status checks obrigatórios.

### KI-008 — Migrações sem ledger e rollback

- **Status:** Aberto.
- **Impacto:** schema difícil de reproduzir e reverter.
- **Evidência:** `backend/src/scripts/migrate-*.ts`.
- **Correção esperada:** ferramenta de migração versionada com up/down.

### KI-009 — Dependências e UI mortas

- **Status:** Em avaliação.
- **Impacto:** instalação maior, bundle e manutenção pior.
- **Evidência:** 42 dependências sem runtime; MUI/Emotion sem uso; 40 módulos shadcn inalcançáveis.
- **Correção esperada:** remover dependências e módulos não usados.

### KI-010 — Documentação antiga citava Mantine/MUI

- **Status:** Corrigido nesta documentação.
- **Impacto:** stack incorreto confundia manutenção.
- **Evidência:** código real usa Tailwind + Radix/shadcn-style.
- **Observação:** MUI/Emotion continuam instalados e sem uso.

### KI-011 — OTP em logs estava desatualizado

- **Status:** Corrigido nesta documentação.
- **Impacto:** instruções antigas mandavam buscar código no log.
- **Evidência:** comportamento atual retorna `demo_code` e abre modal.

### KI-012 — URL antiga da Karina

- **Status:** Corrigido nesta documentação.
- **URL atual:** `https://karina-alexitsch-estudio.vercel.app`.

### KI-013 — Galeria vazia reidrata imagens padrão

- **Status:** Aberto.
- **Impacto:** administrador não consegue manter galeria vazia.
- **Evidência:** `frontend/src/app/context/GalleryContext.tsx`.
- **Correção esperada:** marcador explícito de inicialização/migração.

### KI-014 — Sem observabilidade profunda

- **Status:** Planejado.
- **Impacto:** diagnóstico limitado em produção.
- **Evidência:** `/health` raso e logger sem request ID.
- **Correção esperada:** health de dependências, logs estruturados, métricas, traces e alertas.

### KI-015 — `.DS_Store` rastreado

- **Status:** Aberto.
- **Impacto:** ruído no repositório.
- **Evidência:** `.DS_Store` na raiz.
- **Correção esperada:** remover do Git e adicionar ao `.gitignore`.

### KI-016 — Sem licença definida

- **Status:** Em avaliação.
- **Impacto:** repositório público sem clareza de reuso.
- **Observação:** a seção de licença foi omitida dos READMEs nesta etapa por decisão do projeto.

### KI-017 — Projetos Vercel sem vínculo Git

- **Status:** Aberto.
- **Impacto:** deploy manual via CLI; `main` não é fonte automática de deploy.
- **Evidência:** projetos sem `gitRepository`/link Git.
- **Correção esperada:** conectar ao GitHub ou criar workflow de deploy.

### KI-018 — Backend de work schedules sem `ParseIntPipe`

- **Status:** Aberto.
- **Impacto:** validação de `id` menos consistente.
- **Evidência:** `work-schedule.controller.ts`.

### KI-019 — Sync Google síncrono e sem retry

- **Status:** Aberto.
- **Impacto:** falha/latência no Google afeta resposta e não há fila.
- **Evidência:** `google-calendar.service.ts`.
- **Correção esperada:** fila, retry, backoff e isolamento por agendamento.

### KI-020 — Uma conexão Google por banco

- **Status:** Em avaliação.
- **Impacto:** todos os agendamentos vão para a agenda do admin conectado.
- **Correção esperada:** decisão de produto sobre agenda por profissional.

### KI-021 — Double booking concorrente

- **Status:** Aberto.
- **Impacto:** duas requisições simultâneas podem criar horários sobrepostos.
- **Evidência:** `validateSlot` + `Schedule.create` sem constraint.
- **Correção esperada:** transação + constraint/exclusion.

### KI-022 — Sem validação de data passada e procedimento inativo

- **Status:** Aberto.
- **Impacto:** agendamentos inválidos podem ser criados.
- **Evidência:** `SchedulesService.validateSlot`.
- **Correção esperada:** validar data, status e sessão.

### KI-023 — Sessões/triagem/bloqueio não aplicados integralmente

- **Status:** Aberto.
- **Impacto:** campos existem no modelo, mas não governam o fluxo completo.
- **Evidência:** `sessions`, `triagem`, `bloqueio_periodo`.
- **Correção esperada:** definir regra de produto e implementar.

### KI-024 — Cache de usuário pode ficar desatualizado

- **Status:** Aberto.
- **Impacto:** mudança de contato/role pode demorar até 1h para refletir.
- **Evidência:** `AuthGuard`, cache `user:<id>`.
- **Correção esperada:** invalidar cache em toda alteração.

### KI-025 — Sem contador de tentativas de OTP

- **Status:** Aberto.
- **Impacto:** código não é invalidado após erros; rate limit é a única barreira.
- **Evidência:** fluxos de verificação em `auth.service.ts`.
- **Correção esperada:** tentativas por código e invalidação.

## P2 — UX, qualidade e operação

### KI-026 — Frontend sem typecheck/lint

- **Status:** Planejado.
- **Impacto:** Vite transpila sem checagem de tipos.
- **Correção esperada:** `tsconfig.json`, ESLint, scripts e CI.

### KI-027 — Bundle único e grande

- **Status:** Planejado.
- **Impacto:** carregamento inicial maior.
- **Correção esperada:** code splitting por rota.

### KI-028 — Configs de todas as variantes no bundle

- **Status:** Aceito temporariamente.
- **Impacto:** conteúdo/config de outra marca é público.
- **Observação:** não é controle de acesso.

### KI-029 — Controles admin visíveis para não-admin

- **Status:** Aberto.
- **Impacto:** usuário vê ações que o backend rejeita.
- **Evidência:** Settings, Categories, EmployeeDetail.
- **Correção esperada:** gate visual por `isAdmin`.

### KI-030 — Login não redireciona autenticado

- **Status:** Aberto.
- **Impacto:** usuário logado pode cair em `/login`.
- **Correção esperada:** redirect por perfil.

### KI-031 — `Agendar agora` envia logado para login

- **Status:** Aberto.
- **Impacto:** fricção e perda de contexto.
- **Evidência:** `LandingPage`, `ProcedureDetailDialog`.
- **Correção esperada:** usar `/agendar/:treatmentId`.

### KI-032 — `/cliente` sem index route

- **Status:** Aberto.
- **Impacto:** layout vazio em acesso direto.
- **Correção esperada:** redirect para `/cliente/agendamentos`.

### KI-033 — IDs de detalhe de cliente inconsistentes

- **Status:** Aberto.
- **Impacto:** URL de admin e profissional não são intercambiáveis.
- **Correção esperada:** padronizar user ID ou separar rotas.

### KI-034 — Tailwind v4 e `bg-opacity-50`

- **Status:** Aberto.
- **Impacto:** overlay do POP fica opaco.
- **Correção esperada:** usar `bg-black/50`.

### KI-035 — Acessibilidade incompleta

- **Status:** Planejado.
- **Impacto:** diálogos sem descrição, overlays customizados, labels, teclado e ícones.
- **Correção esperada:** auditoria WCAG e testes axe.

### KI-036 — Notificações ocultas

- **Status:** Aceito temporariamente.
- **Evidência:** `NOTIFICATIONS_ENABLED=false`.
- **Impacto:** rotas existem, mas não aparecem na navegação.

### KI-037 — Env examples inválidos

- **Status:** Aberto.
- **Impacto:** setup pode falhar ao copiar exemplos.
- **Evidência:** `.env.example`, `.env.test.example`.

## Integrações em avaliação

- **WhatsApp oficial:** API Cloud da Meta, sujeita a verificação empresarial e custo por mensagem.
- **E-mail:** SendGrid foi considerado inicialmente; Brevo passou a ser avaliado depois. Nenhum provedor implementado.
- **Google Agenda:** implementado em modo unidirecional.
- **Pagamentos, prontuário e gestão financeira:** fora do escopo atual.

## Roadmap de correção

1. modo demo seguro;
2. resposta genérica de login/recuperação;
3. CORS e autorização de disponibilidade;
4. disponibilidade por duração;
5. CI, typecheck e lint;
6. migrações versionadas;
7. observabilidade e backups;
8. limpeza de dependências;
9. OTP real por e-mail/WhatsApp;
10. releases e rollback.
