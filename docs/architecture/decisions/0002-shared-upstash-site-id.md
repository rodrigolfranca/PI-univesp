# ADR 0002 — Upstash compartilhado com SITE_ID

## Status

Aceito.

## Contexto

O plano gratuito do Upstash limita a quantidade de bancos. Dayane e Karina precisam de OTP, sessões, cache, OAuth state e rate limit.

## Decisão

Usar um único banco Redis para as duas marcas, prefixando todas as chaves com `SITE_ID`.

## Consequências

Positivas:

- um único recurso de Redis;
- menor custo e complexidade;
- isolamento lógico por prefixo.

Negativas:

- risco de colisão se `SITE_ID` estiver ausente;
- vazamento lógico entre marcas se uma chave não for prefixada;
- consumo e limites compartilhados;
- fallback em memória do rate limit não usa prefixo de site.
