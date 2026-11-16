# Documentação — PI-univesp

Índice central da documentação técnica e operacional.

> [!WARNING]
> Projeto acadêmico em desenvolvimento. O código OTP é exibido em modal para demonstração e não deve ser usado com dados reais.

## Por onde começar

| Objetivo                          | Documento                                             |
| --------------------------------- | ----------------------------------------------------- |
| Rodar o projeto localmente        | [Primeiros passos](getting-started.md)                |
| Entender a arquitetura            | [Visão geral](architecture/overview.md)               |
| Entender o modelo de dados        | [Modelo de dados](architecture/data-model.md)         |
| Entender autenticação e segurança | [Auth e segurança](architecture/auth-and-security.md) |
| Entender Dayane/Karina            | [Multi-site](architecture/multi-site.md)              |
| Fazer deploy                      | [Deployment](operations/deployment.md)                |
| Consultar variáveis               | [Configuração](reference/configuration.md)            |
| Consultar endpoints               | [API](reference/api.md)                               |
| Ver riscos e pendências           | [Known issues](reference/known-issues.md)             |

## Arquitetura

- [Visão geral](architecture/overview.md)
- [Modelo de dados](architecture/data-model.md)
- [Autenticação e segurança](architecture/auth-and-security.md)
- [Multi-site](architecture/multi-site.md)
- [ADRs](architecture/decisions/0001-vercel-supabase-upstash.md)

## Operações

- [Deployment](operations/deployment.md)
- [Ambientes](operations/environments.md)
- [Migrações](operations/migrations.md)
- [Backups e restauração](operations/backups-and-restore.md)
- [Observabilidade](operations/observability.md)
- [Rollback](operations/rollback.md)
- [Runbook](operations/runbook.md)

## Referência

- [API](reference/api.md)
- [Configuração](reference/configuration.md)
- [Controle de acesso](reference/access-control.md)
- [Modo demonstração](reference/demo-mode.md)
- [Scripts](reference/scripts.md)
- [Variantes](reference/variants.md)
- [Known issues](reference/known-issues.md)

## Desenvolvimento

- [Setup local](development/local-setup.md)
- [Testes](development/testing.md)
- [Release](development/release.md)

## Públicos

### Usuário e demonstração

Leia o [README raiz](../README.md), depois [Primeiros passos](getting-started.md) e [Modo demonstração](reference/demo-mode.md).

### Operador

Leia [Deployment](operations/deployment.md), [Ambientes](operations/environments.md), [Migrações](operations/migrations.md) e [Runbook](operations/runbook.md).

### Desenvolvedor

Leia [Arquitetura](architecture/overview.md), [Modelo de dados](architecture/data-model.md), [Setup local](development/local-setup.md) e [Testes](development/testing.md).

### Auditor

Leia [Auth e segurança](architecture/auth-and-security.md), [Controle de acesso](reference/access-control.md), [Known issues](reference/known-issues.md) e [Observabilidade](operations/observability.md).
