# Modo demonstração

Esta versão expõe códigos OTP na interface para permitir demonstração acadêmica sem depender de envio real por e-mail ou WhatsApp.

> [!WARNING]
> Qualquer pessoa que souber o telefone de uma conta demo pode obter o código e entrar. Não use este modo com dados reais.

## Contas demo

Os telefones são iguais nos ambientes Dayane e Karina, pois cada marca usa um banco separado.

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

A tela de login mostra atalhos para Admin, Profissional e Cliente. O atalho apenas preenche o telefone; o código é solicitado normalmente e exibido em modal com botão de copiar.

## Dataset

Cada marca recebe:

- 1 admin;
- 3 profissionais não-admin;
- 6 clientes;
- 5 categorias;
- 8 procedimentos;
- vínculos entre procedimentos e profissionais;
- horários de trabalho;
- exceções de abertura e bloqueio;
- 12 agendamentos de exemplo.

## Seed

Com o banco da marca configurado em `DB_*` e `SITE_ID` definido:

```bash
cd backend
NODE_ENV=prod npm run seed:demo
```

O seed é idempotente e não chama o Google Calendar.

Para Dayane:

```bash
SITE_ID=dayane NODE_ENV=prod npm run seed:demo
```

Para Karina:

```bash
SITE_ID=karina NODE_ENV=prod npm run seed:demo
```

## Comportamento dos códigos

- Todo endpoint que gera código retorna `demo_code`.
- O frontend abre um modal automaticamente.
- O botão `Copiar código` usa a área de transferência.
- O botão `Ver código novamente` reabre o último código.
- Os códigos não são mais impressos nos logs.

Quando houver envio real por e-mail/WhatsApp, o campo `demo_code` e o modal devem ser removidos.
