# Migrações

## Estado atual

O schema inicial é criado por `sequelize.sync()` quando `DB_SYNC=true`.

Em produção:

- `DB_SYNC=false`;
- migrações são scripts TypeScript com SQL idempotente;
- não há tabela de histórico;
- não há up/down formal;
- não há rollback automático.

## Ordem atual

```bash
npm run migrate:schedule-exception-name
npm run migrate:google-event-link
npm run migrate:categories
npm run migrate:procedure-professionals
npm run migrate:procedure-status
npm run migrate:brand-gallery
npm run migrate:confirmed-contacts
npm run seed:admin
npm run seed:demo
```

## Responsabilidades

- `migrate:schedule-exception-name`: garante coluna de nome.
- `migrate:google-event-link`: garante link do evento Google.
- `migrate:categories`: garante categoria e vínculo.
- `migrate:procedure-professionals`: cria tabela N:N e vínculos iniciais.
- `migrate:procedure-status`: garante status do procedimento.
- `migrate:brand-gallery`: garante tabelas de marca/galeria.
- `migrate:confirmed-contacts`: marca usuários existentes como confirmados.
- `seed:admin`: cria/garante admin.
- `seed:demo`: cria dataset de demonstração.

## Cuidados

- `migrate:confirmed-contacts` marca todos os usuários existentes como confirmados.
- `seed:demo` pode alterar dados de usuários demo existentes.
- `migrate:procedure-professionals` completa apenas procedimentos sem vínculo.
- `DB_SYNC=true` em produção pode criar schema inesperado.
- Não há validação automática de ordem.

## Ordem operacional

1. backup;
2. migrações;
3. seed;
4. deploy backend;
5. smoke test;
6. deploy frontend.

## Trabalho futuro

- adotar Umzug/sequelize-cli;
- criar baseline;
- up/down por versão;
- ledger de migrações;
- executar migrações em CI;
- remover dependência de `sync` para schema.

## Comandos de referência

Use session pooler (`DB_PORT=5432`) para migrações e seeds.

No runtime Vercel, transaction pooler (`DB_PORT=6543`) e `DB_SYNC=false`.
