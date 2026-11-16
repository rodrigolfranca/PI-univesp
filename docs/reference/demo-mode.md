# Modo demonstração

## Objetivo

Permitir que professores e avaliadores testem login, cadastro, recuperação e contato sem envio real de e-mail ou WhatsApp.

## Como funciona

- O backend retorna `demo_code`.
- O frontend abre um modal.
- O código pode ser copiado.
- O último código pode ser reaberto.
- Atalhos preenchem telefone de Admin, Profissional e Cliente.

## Contas

| Papel          | Telefone      |
| -------------- | ------------- |
| Admin          | `11999990001` |
| Profissional 1 | `11999990002` |
| Profissional 2 | `11999990003` |
| Profissional 3 | `11999990004` |
| Cliente 1      | `11999990005` |
| Cliente 2      | `11999990006` |
| Cliente 3      | `11999990007` |
| Cliente 4      | `11999990008` |
| Cliente 5      | `11999990009` |
| Cliente 6      | `11999990010` |

Os telefones são iguais nos dois ambientes porque os bancos são separados.

## Dataset

Por marca:

- 1 admin;
- 3 profissionais não-admin;
- 6 clientes;
- 5 categorias de negócio, além de `Geral`;
- 8 procedimentos;
- 24 vínculos procedimento-profissional;
- 17 horários;
- 3 exceções;
- 12 agendamentos.

## Seed

```bash
cd backend
SITE_ID=dayane NODE_ENV=prod npm run seed:demo
SITE_ID=karina NODE_ENV=prod npm run seed:demo
```

O seed é idempotente e não cria eventos no Google.

## Segurança

Este modo é inseguro por definição:

- códigos aparecem no navegador;
- qualquer pessoa com o telefone pode entrar;
- não há flag de ambiente;
- não há envio real;
- não usar com dados reais.

## Trabalho futuro

- flag `DEMO_MODE`;
- envio real por e-mail;
- envio real por WhatsApp;
- remoção de `demo_code` em produção;
- remoção do modal e dos atalhos demo.
