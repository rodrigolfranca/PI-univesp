# Multi-site

## Topologia

| Recurso                  | Quantidade    | Uso                                 |
| ------------------------ | ------------- | ----------------------------------- |
| Frontends na Vercel      | 2             | Dayane e Karina                     |
| Backends na Vercel       | 2             | Dayane e Karina                     |
| Bancos Supabase          | 2             | isolamento por marca                |
| Upstash Redis            | 1             | compartilhado com prefixo `SITE_ID` |
| Buckets Supabase Storage | 1 por projeto | logo e galeria                      |

## Domínios

- Dayane: `https://dayane-di-giovanni-estetica.vercel.app`
- Karina: `https://karina-alexitsch-estudio.vercel.app`

## Variáveis por backend

Cada backend tem valores próprios para:

- `SITE_ID` (`dayane` ou `karina`);
- `DB_*`;
- `SUPABASE_*`;
- `CORS_ORIGINS`;
- `GOOGLE_REDIRECT_URI`;
- `JWT_SECRET`;
- `GOOGLE_TOKEN_ENCRYPTION_KEY`.

`REDIS_URL`, `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` podem ser compartilhados.

## Redis

Todas as chaves usam `SITE_ID`:

- `<site>:auth_code:*`
- `<site>:signup:*`
- `<site>:recovery:*`
- `<site>:session:*`
- `<site>:user:*`
- `<site>:contact_change:*`
- `<site>:google_oauth_state:*`
- `<site>:ratelimit:*`

Sem `SITE_ID`, o fallback `site` pode causar colisão. Em produção, `SITE_ID` é obrigatório.

## Isolamento

- dados de negócio ficam em bancos separados;
- Storage fica em projetos separados;
- Redis é compartilhado, mas prefixado;
- frontend e backend são projetos Vercel separados.

O isolamento de banco é externo ao código. Apontar dois backends para o mesmo banco compartilharia os dados.

## Frontend

A variante é escolhida por:

1. domínio registrado no manifesto;
2. `VITE_CLIENTE`;
3. `defaultVariant` em `src/variants/settings.json`.

Os configs de todas as variantes são emitidos no bundle. Isso não é um mecanismo de autorização.

## Limitações

- Sincronização Google é uma conexão por banco, não por profissional.
- Variantes não isolam dados por si só; o isolamento depende da infraestrutura.
- `SITE_ID` não é obrigatório fora de produção.
- Domínios não registrados caem na variante padrão.

## Documentos relacionados

- [Arquitetura](overview.md)
- [Auth e segurança](auth-and-security.md)
- [Configuração](../reference/configuration.md)
- [Variantes](../reference/variants.md)
