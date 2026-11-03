# Aplicação de serviços com variantes por domínio

Uma aplicação React/Vite atende diferentes negócios de serviços. Cada variante tem seu próprio conteúdo, catálogo, tema e dados iniciais. O domínio seleciona a variante antes da montagem da aplicação; apenas a configuração selecionada é carregada. A lista de domínios vem dos manifestos descobertos automaticamente.

## Adicionar uma variante

Use Node.js 22 ou superior.

```sh
npm install
npm run variant:create -- oficina
```

O comando cria `src/variants/oficina/manifest.json`, `src/variants/oficina/config.json` e `public/variants/oficina/`. Não sobrescreve pastas existentes. Edite o domínio de exemplo e o nome do negócio:

```json
{
  "id": "oficina",
  "domains": ["oficina.vercel.app", "agenda.exemplo.com.br"]
}
```

O ID deve corresponder ao nome da pasta e conter letras minúsculas, números e hífens. Mantenha o ID estável ao trocar nome ou domínio, pois ele identifica o armazenamento em desenvolvimento e previews.

A configuração mínima precisa apenas do nome. Os demais campos recebem padrões neutros de `src/app/config/defaults.json`. Nenhum contato, imagem ou dado comercial de outra variante é herdado.

```json
{
  "identity": {
    "name": "Oficina Exemplo",
    "tagline": "Manutenção e reparos",
    "description": "Agende a manutenção dos seus equipamentos.",
    "logo": {
      "public": "/variants/oficina/logo.svg",
      "dashboard": "/variants/oficina/logo.svg",
      "presentation": "plain"
    }
  },
  "theme": { "preset": "azul" },
  "terms": { "procedure": "reparo", "procedures": "reparos", "establishment": "oficina" },
  "contact": { "whatsapp": "5511999999999", "instagram": "oficina_exemplo" },
  "catalog": {
    "icon": "wrench",
    "categories": [{ "id": 1, "name": "Manutenção" }],
    "procedures": [{
      "id": 1, "name": "Revisão de equipamento", "category": "Manutenção",
      "duration": "60 min", "price": "A consultar", "status": "Ativo",
      "description": "Inspeção e manutenção preventiva."
    }]
  },
  "agenda": { "timeSlots": ["08:30", "13:30"], "blockedSlots": [] }
}
```

Copie o logotipo para `public/variants/oficina/logo.svg`. As referências devem começar com `/variants/oficina/`; a validação verifica se os arquivos existem. Arrays substituem a lista inteira: `[]` significa lista vazia. Objetos podem conter apenas os campos que você deseja alterar. Campos desconhecidos são rejeitados para identificar erros de digitação.

```sh
npm run variants:validate
VITE_CLIENTE=oficina npm run dev
npm run build
```

Adicionar uma pasta válida basta para o registro automático. Nenhum componente, tipo de ID ou seletor precisa ser editado. Alterações de configuração e assets são validadas no desenvolvimento e no build. Após uma configuração inválida no desenvolvimento, corrija o arquivo para recuperar o carregamento; se a inicialização falhar, reinicie o servidor após a correção.

## Campos disponíveis

- `identity`: nome, descrição, subtítulo e logotipos. `presentation` aceita `plain` ou `framed`; sem imagem, o site mostra as iniciais.
- `theme`: `preset` (`wine`, `rosa`, `roxo`, `azul`, `dourado` ou `cinza`) e, opcionalmente, `palette` com todas as tonalidades `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`, em `#RRGGBB`. A paleta personalizada prevalece sobre o preset.
- `terms`: `service`, `services`, `procedure`, `procedures`, `establishment`, `professional`, `professionals`. Altera a terminologia funcional exibida, mantendo as rotas existentes. Os textos comerciais definidos em `content` são exibidos como escritos; ajuste suas frases e concordância diretamente.
- `content`: títulos e introduções das páginas (`pageHeadings`), apresentação (`hero`, `authTagline`), benefícios (`features`), apresentação da home (`homeAbout`), página sobre (`about`), cards estáticos de tratamentos (`treatments`), experiência (`experience`), chamadas do catálogo e contato, rodapé (`footer`) e informações do responsável (`owner`). Parágrafos e cards são listas. Blocos opcionais vazios não são renderizados.
- `contact`: endereço e horários como listas de linhas, telefone, e-mail, WhatsApp como número com DDI ou link `https://wa.me/...`, Instagram sem `@`. Contatos ausentes não geram links vazios.
- `catalog`: categorias, procedimentos editáveis, galeria e ícone dos serviços. O catálogo editável é independente dos cards estáticos em `content.treatments`.
- `agenda`: horários disponíveis e bloqueados em `HH:MM`. A disponibilidade continua demonstrativa, sem reserva no servidor.
- `data`: listas iniciais de clientes, agendamentos, equipe, notificações de gestão e cliente, agendamentos demonstrativos da área de cliente e documentos de exemplo. Novas variantes começam com listas vazias.

Os contratos completos ficam em `src/app/config/types.ts`; `defaults.json` oferece uma referência dos grupos e valores padrão. As configurações existentes exemplificam listas preenchidas. Ícones aceitos: `briefcase`, `calendar`, `sparkles`, `heart`, `star`, `award`, `users`, `droplet`, `zap`, `activity`, `clock`, `wrench`, `scissors`, `phone`.

## Seleção, dados salvos e publicação

Domínios registrados sempre prevalecem sobre `VITE_CLIENTE`. Localhost e previews usam essa variável; sem ela, usam o ID em `src/variants/settings.json` (`defaultVariant`). Reinicie o servidor ao alterar a variável. Uma seleção explícita inexistente gera erro de configuração. Os domínios publicados devem estar cadastrados nos manifestos.

Nos domínios registrados, as chaves de armazenamento existentes são preservadas. Nos demais ambientes, recebem o prefixo `<id>:` para permitir alternar variantes na mesma origem. Edições salvas no navegador prevalecem sobre os dados iniciais, inclusive listas vazias. O formato antigo dos parágrafos e temas é adaptado ao carregar; novos salvamentos usam arrays e a configuração de tema atual. A persistência e a autenticação continuam locais e demonstrativas, sem sincronização entre navegadores ou integração com backend.

Na Vercel, use `frontend` como diretório raiz, `npm run build` e saída `dist`. Associe os domínios ao mesmo projeto e gere uma implantação após cadastrar variantes. `vercel.json` mantém o acesso direto e a recarga das rotas internas. Para previews, defina `VITE_CLIENTE` antes do build. A associação de domínios é feita na plataforma; nenhum domínio é criado pelo comando de cadastro.

As configurações Dayane e Karina mantêm o conteúdo anterior. O contato, alguns textos e dados de demonstração herdados da Dayane continuam explicitamente na configuração da Karina, conforme solicitado. A pasta original `Karina Alexitsch` permanece como referência.

## Verificação

`npm test` verifica padrões neutros, criação e descoberta de variantes, aliases, validações, assets, paletas e compatibilidade do armazenamento. `npm run build` também valida todas as configurações. As fixtures em `tests/fixtures` ficam fora do registro e não são publicadas.
