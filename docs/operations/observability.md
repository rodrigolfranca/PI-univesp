# Observabilidade

## Estado atual

O backend possui:

- `GET /health` com `{ "status": "ok" }`;
- request logger com método, rota, status e duração;
- logs de erro padronizados via `Utils.logError`.

Não há:

- request ID;
- logs estruturados;
- métricas;
- traces;
- alertas;
- dashboards;
- auditoria de ações administrativas;
- health check de dependências.

## Health

O endpoint atual não verifica:

- conexão com PostgreSQL;
- conexão com Redis;
- configuração do Supabase;
- estado da conexão Google.

Recomendado no futuro:

- `/health/live`;
- `/health/ready` com `SELECT 1` e `PING`;
- versão e SHA do deploy na resposta.

## Logs

Recomendado incluir:

- `request_id`;
- `site_id`;
- rota;
- método;
- status;
- latência;
- user id, quando autenticado;
- tipo de erro.

Nunca logar:

- códigos OTP;
- tokens JWT;
- refresh tokens;
- senhas;
- service role keys.

## Métricas prioritárias

- taxa de 5xx;
- latência p95/p99;
- erros de OTP;
- rate limit 429;
- falhas de conexão DB/Redis;
- falhas na sincronização Google;
- disponibilidade do health check.

## Alertas prioritários

- health check falhando;
- 5xx acima do limite;
- banco indisponível;
- Redis indisponível;
- backup falhando;
- uso de Supabase/Upstash próximo do limite.

## Auditoria

Ações que merecem registro:

- exclusão de usuário;
- alteração de contato;
- alteração de privilégio;
- alteração de marca/galeria;
- conexão/desconexão Google;
- migrações e seeds.

## Pendências

- integrar Sentry/OpenTelemetry;
- adicionar request ID;
- criar dashboards;
- documentar SLOs;
- criar alertas.
