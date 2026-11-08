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
    "procedures": [
      {
        "id": 1,
        "name": "Revisão de equipamento",
        "category": "Manutenção",
        "duration": "60 min",
        "price": "A consultar",
        "status": "Ativo",
        "description": "Inspeção e manutenção preventiva."
      }
    ]
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
- `agenda`: horários padrão de apresentação da variante. A disponibilidade usada no agendamento vem da API de horários de trabalho.
- `data`: dados demonstrativos usados apenas nas áreas ainda locais, como notificações, complementos de perfil, documentos/histórico do cliente e configuração visual. Clientes, procedimentos e agendamentos reais vêm da API.

Os contratos completos ficam em `src/app/config/types.ts`; `defaults.json` oferece uma referência dos grupos e valores padrão. As configurações existentes exemplificam listas preenchidas. Ícones aceitos: `briefcase`, `calendar`, `sparkles`, `heart`, `star`, `award`, `users`, `droplet`, `zap`, `activity`, `clock`, `wrench`, `scissors`, `phone`.

## Seleção, dados salvos e publicação

Domínios registrados sempre prevalecem sobre `VITE_CLIENTE`. Localhost e previews usam essa variável; sem ela, usam o ID em `src/variants/settings.json` (`defaultVariant`). Reinicie o servidor ao alterar a variável. Uma seleção explícita inexistente gera erro de configuração. Os domínios publicados devem estar cadastrados nos manifestos.

Nos domínios registrados, as chaves de armazenamento existentes são preservadas. Nos demais ambientes, recebem o prefixo `<id>:` para permitir alternar variantes na mesma origem. Edições salvas no navegador prevalecem sobre os dados iniciais, inclusive listas vazias. O formato antigo dos parágrafos e temas é adaptado ao carregar; novos salvamentos usam arrays e a configuração de tema atual. Cadastro, autenticação, usuários, procedimentos, agenda, disponibilidade, POPs e Google Agenda usam o backend. Notificações, complementos de perfil, documentos/histórico do cliente, galeria, marca e categorias continuam locais.

Na Vercel, use `frontend` como diretório raiz, `npm run build` e saída `dist`. Associe os domínios ao mesmo projeto e gere uma implantação após cadastrar variantes. `vercel.json` mantém o acesso direto e a recarga das rotas internas. Para previews, defina `VITE_CLIENTE` antes do build. A associação de domínios é feita na plataforma; nenhum domínio é criado pelo comando de cadastro.

O frontend e o backend são projetos Vercel separados. Em produção, defina `VITE_API_BASE_URL` com a URL pública do backend, sem `/api` no final, e defina `CORS_ORIGINS` no backend com a origem do frontend. O proxy do Vite existe apenas em desenvolvimento; não use `VITE_API_BASE_URL=/api` em produção.

As configurações Dayane e Karina mantêm o conteúdo anterior. O contato, alguns textos e dados de demonstração herdados da Dayane continuam explicitamente na configuração da Karina, conforme solicitado. A pasta original `Karina Alexitsch` permanece como referência.

## Convenções de código

Use `npm run format` para formatar o frontend e `npm run format:check` para conferir o padrão sem alterar arquivos. O Prettier usa dois espaços, aspas duplas, ponto e vírgula, vírgulas finais e largura preferencial de 100 caracteres. Dependências, builds, assets e arquivos gerados ficam fora da formatação.

Separe blocos de responsabilidade com linhas em branco, prefira nomes claros e mantenha comentários para explicar decisões e limitações. Defina handlers nomeados fora dos atributos JSX. Evite ternários aninhados; use condições explícitas ou funções para decisões com vários casos. Nas alternativas de renderização, prefira componentes simples (`condicao ? <ComponenteA /> : <ComponenteB />`) e extraia blocos maiores para componentes próprios. Rótulos que apenas repetem o JSX não são necessários. Preserve os contratos das variantes e as interfaces dos componentes ao fazer limpezas de legibilidade.

## Integração de clientes e profissionais

Use Node.js 22 ou superior. Instale as dependências com `npm install` e copie `.env.example` para `.env.local` se precisar alterar o destino da API:

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:3000
```

Execute `npm run dev` com o backend e suas dependências já disponíveis. O proxy do Vite encaminha `/api/*` ao destino configurado, removendo `/api`; não é necessário modificar o backend nem habilitar CORS para desenvolvimento. Reinicie o Vite após alterar as variáveis. Nenhuma variável `VITE_*` deve conter segredos: seus valores são públicos no navegador.

### Fluxo e permissões

- Cadastro público: cria uma conta de cliente com nome, telefone de 11 dígitos e e-mail. Não confirma o telefone nem inicia uma sessão automaticamente. Após cadastrar, entre com o telefone e o código.
- Login: solicita um código e valida seus seis dígitos pela API. O envio por WhatsApp ainda está pendente no backend; em desenvolvimento, obtenha o código no log do servidor. O código vale cinco minutos. Telefones desconhecidos recebem a mesma mensagem de solicitação, sem criar conta ou sessão.
- Sessão: token em `sessionStorage`, isolado por variante e destino da API. A recarga consulta o perfil no servidor; logout e expiração limpam a sessão. A sessão demonstrativa antiga é descartada. Não há refresh token nem endpoint de logout: sair remove a sessão deste navegador.
- Clientes podem consultar e editar o próprio perfil em `/cliente/perfil` e criar os próprios agendamentos escolhendo procedimento, data, horário disponível e profissional.
- Profissionais consultam e editam o próprio perfil nas configurações. Podem consultar outros usuários por ID, mas não listar nem editar terceiros.
- Administradores podem listar, cadastrar, editar e excluir clientes e profissionais. Também gerenciam procedimentos, POPs, disponibilidade, exceções de agenda e Google Agenda. As listas percorrem todas as páginas da API antes da busca local. Uma conta administrativa já existente é necessária; o frontend não cria administradores nem altera privilégios.
- As rotas de detalhes usam o ID de **usuário**, não o ID do vínculo de cliente/profissional. Excluir remove a conta de usuário e afeta ambos os vínculos quando existentes.

O backend não separa usuários por variante/negócio. As variantes selecionam apresentação e armazenamento local; para bases de usuários separadas, configure destinos de API separados. Não há isolamento por negócio implementado no frontend.

### Recursos demonstrativos e pendências

Os comentários `TODO(integracao)` marcam os limites da integração:

- Status, última visita, cargo específico e documentos do cliente na tela de usuário continuam locais, separados por variante, API e ID real do usuário. Contas novas começam com status demonstrativo “Ativo”, última visita “—”, cargo “Profissional” e documentos vazios. O cargo não altera permissões. Nenhum desses campos é enviado à API de usuários.
- POPs de procedimento são reais: upload, listagem, download e exclusão usam a API. Documentos e histórico exibidos nos complementos do usuário continuam demonstrativos.
- Agenda, procedimentos, disponibilidade e POPs usam a API. Notificações administrativas/cliente, galeria, marca e categorias continuam locais/demonstrativas.
- Recuperação por e-mail está integrada à API para alterar o telefone. Como o envio de e-mail ainda não existe, o código aparece no log do backend. Troca de senha é apenas um aviso de recurso pendente: o backend autentica por código e não oferece senha.
- Falhas da API aparecem na tela e nunca ativam um fallback para dados fictícios. Erros de permissão não encerram automaticamente a sessão, pois os guards do backend também usam HTTP 401 para autorização.

Em produção, a API é acessada diretamente pela URL configurada em `VITE_API_BASE_URL`; o backend precisa liberar a origem do frontend em `CORS_ORIGINS`. O rewrite de `vercel.json` atende apenas as rotas internas do SPA.

### Validação

```sh
npm test
npm run variants:validate
npm run build
npm run format:check
```

Os testes usam Vitest, jsdom e Testing Library. As respostas HTTP são simuladas conforme os contratos do backend; isso não substitui a validação com PostgreSQL, Redis e uma conta administrativa reais.

Para validar manualmente com o backend disponível: cadastrar um cliente, fazer login com o código do log, recarregar a página, editar o próprio perfil e sair. Com administrador, cadastrar cliente/profissional, consultar a URL de detalhes, editar e excluir uma conta de teste. Com profissional comum, verificar acesso restrito às listas, consulta por ID e edição apenas do próprio perfil. Conferir erros de duplicidade e código inválido/expirado, além da preservação de `treatmentId` entre cadastro e login.
