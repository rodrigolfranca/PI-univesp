# Variantes

## Estrutura

```text
frontend/src/variants/<id>/
├── manifest.json
└── config.json
```

Assets ficam em:

```text
frontend/public/variants/<id>/
```

## Manifest

```json
{
  "id": "dayane",
  "domains": ["dayane-di-giovanni-estetica.vercel.app"]
}
```

## Config

Define:

- identidade;
- tema;
- terminologia;
- conteúdo;
- contato;
- catálogo;
- agenda;
- dados demonstrativos.

## Seleção

1. domínio registrado;
2. `VITE_CLIENTE`;
3. `defaultVariant`.

## Validação

```bash
npm run variants:validate
```

Valida:

- ID;
- domínio;
- schema;
- assets;
- tema;
- campos desconhecidos.

## Criação

```bash
npm run variant:create -- <id>
```

## Limitações

- domínio não registrado cai na variante padrão;
- configs de todas as variantes são emitidos no bundle;
- parte da configuração é legada e não é consumida pela aplicação;
- contato da Karina ainda herda dados da Dayane;
- assets grandes sem otimização.
