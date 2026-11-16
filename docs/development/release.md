# Release

## Estado atual

Não há processo formal de release.

- versão dos pacotes: `0.0.1`;
- sem SemVer de produto;
- sem changelog;
- sem GitHub Releases;
- sem tags de produção;
- deploy manual via Vercel CLI.

## Processo recomendado

1. PR revisado e testado.
2. Merge na `main`.
3. CI verde.
4. Release PR automático ou manual.
5. Atualização de `CHANGELOG.md`.
6. Tag `vX.Y.Z`.
7. GitHub Release com notas.
8. Deploy a partir da tag.
9. Smoke test.
10. Registro do SHA e do deployment.

## Versionamento

Recomendado:

- SemVer;
- uma versão de produto ou versões separadas por app;
- tags `vX.Y.Z`;
- releases imutáveis.

## Notas de release

Devem conter:

- mudanças;
- breaking changes;
- migrações;
- variáveis de ambiente;
- riscos;
- instruções de rollback.

## Rollback

- promover deployment anterior na Vercel;
- restaurar banco apenas se necessário;
- seguir [Rollback](../operations/rollback.md).

## Pendências

- CI;
- branch protection;
- conventional commits;
- changelog;
- tags;
- deploy automatizado;
- SBOM e OpenAPI anexados.
