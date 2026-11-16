# ADR 0001 — Vercel, Supabase e Upstash

## Status

Aceito.

## Contexto

O projeto precisa hospedar frontend e backend, banco PostgreSQL, Redis, Storage e OAuth com baixo custo operacional para um projeto acadêmico.

## Decisão

- Frontend e backend na Vercel.
- PostgreSQL e Storage no Supabase.
- Redis no Upstash.
- Google Cloud para OAuth e Calendar API.

## Consequências

Positivas:

- deploy simples;
- serviços gerenciados;
- pouca manutenção de infraestrutura;
- integração com GitHub e domínios.

Negativas:

- dependência de múltiplos provedores;
- limites de planos gratuitos;
- backend serverless com timeout e cold start;
- projetos Vercel atualmente não conectados ao Git;
- migrações e backups exigem processo externo.
