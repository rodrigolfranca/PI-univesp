# ADR 0003 — OTP em modo demonstração

## Status

Aceito temporariamente para demonstração acadêmica.

## Contexto

Não há entrega real de e-mail ou WhatsApp nesta fase. Para permitir que professores e avaliadores testem login, cadastro e recuperação, os códigos precisam ser acessíveis.

## Decisão

- O backend retorna `demo_code`.
- O frontend exibe o código em modal copiável.
- Existem atalhos para contas demo.
- O comportamento não possui flag de ambiente.

## Consequências

Positivas:

- demonstração funciona sem provedor externo;
- todos os fluxos podem ser validados;
- não há custo por mensagem.

Negativas:

- qualquer pessoa com o telefone pode entrar;
- códigos aparecem no navegador e no DevTools;
- não é adequado para dados reais;
- o código precisa ser alterado antes de produção.

## Trabalho futuro

- adicionar flag de modo demo;
- enviar OTP real por e-mail/WhatsApp;
- remover `demo_code` do caminho de produção;
- substituir o modal por entrega externa.
