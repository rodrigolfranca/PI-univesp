# Rollback

## Aplicação

O rollback atual é manual pela Vercel:

1. abrir o projeto;
2. acessar Deployments;
3. localizar o deployment anterior saudável;
4. promover para produção;
5. validar `/health` e login.

## Banco

Não existe rollback automatizado de migração.

Antes de qualquer migração:

- gerar backup;
- registrar o SHA do deploy;
- registrar comandos executados;
- validar em banco de teste quando possível.

Se uma migração falhar:

1. interromper o deploy;
2. avaliar se o estado é parcial;
3. restaurar backup, se necessário;
4. não executar scripts corretivos sem análise.

## Frontend

O frontend pode voltar para o deployment anterior na Vercel.

Cuidados:

- variáveis `VITE_*` exigem rebuild;
- o bundle inclui a URL da API;
- rollback do frontend sem rollback do backend pode gerar incompatibilidade de contrato.

## Google Calendar

Ao voltar a aplicação:

- eventos já criados permanecem no Google;
- uma nova sincronização pode atualizar eventos;
- exclusão de agendamento remove evento;
- cancelamento atualiza o evento com `[CANCELADO]`.

## Ordem recomendada de rollback

1. congelar novas operações;
2. avaliar impacto no banco;
3. restaurar banco, se necessário;
4. reverter backend;
5. reverter frontend;
6. validar login;
7. validar agendamento;
8. comunicar usuários.

## Pendências

- tags de release;
- runbook testado;
- rollback de migração;
- ambientes de staging;
- smoke automatizado.
