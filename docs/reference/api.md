# API

## Documentação interativa

Swagger/OpenAPI:

```text
https://<backend>.vercel.app/documentation
```

Local:

```text
http://localhost:3000/documentation
```

## Autenticação

- JWT no header `Authorization: Bearer <token>`.
- Login por telefone e OTP.
- Sessão revogável no Redis.
- Endpoints públicos não exigem token.

## Grupos de endpoints

### Auth

- `POST /auth/request-code`
- `POST /auth/verify-code`
- `POST /auth/logout`
- `POST /auth/signup/request-code`
- `POST /auth/signup/resend-code`
- `POST /auth/signup/verify-email-code`
- `POST /auth/signup/resend-phone-code`
- `POST /auth/signup/verify-phone-code`
- `POST /auth/recovery/request-email-code`
- `POST /auth/recovery/verify-email-code`
- `POST /auth/recovery/request-phone-code`
- `POST /auth/recovery/verify-phone-code`

### Users

- `GET /users`
- `GET /users/:id`
- `POST /users/client`
- `POST /users/professional`
- `PATCH /users/:id`
- `DELETE /users/:id`
- `GET /users/by-phone`
- `POST /users/:id/contact/request`
- `POST /users/:id/contact/verify`
- `POST /users/:id/contact/confirm-email/request`

### Procedures/Categories

- `GET /procedures`
- `GET /procedures/:id`
- `POST /procedures`
- `PATCH /procedures/:id`
- `DELETE /procedures/:id`
- `GET /categories`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

### Schedules

- `GET /schedules`
- `POST /schedules`
- `PATCH /schedules/:id`
- `DELETE /schedules/:id`
- `GET /schedules/my-clients`
- `GET /schedules/my-clients/:clientId/history`

### Availability

- `GET /work-schedules`
- `GET /work-schedules/all`
- `GET /work-schedules/available-dates`
- `GET /work-schedules/availability-summary`
- `POST /work-schedules`
- `PATCH /work-schedules/update/:id`
- `DELETE /work-schedules/delete/:id`
- `GET /schedule-exceptions`
- `POST /schedule-exceptions`
- `PATCH /schedule-exceptions/:id`
- `DELETE /schedule-exceptions/:id`

### POPs

- `GET /pops`
- `GET /pops/:id`
- `GET /pops/:id/download`
- `POST /pops`
- `PATCH /pops/:id`
- `DELETE /pops/:id`

### Site

- `GET /site/brand`
- `PUT /site/brand`
- `POST /site/brand/logo`
- `GET /site/gallery`
- `POST /site/gallery`
- `PATCH /site/gallery/:id`
- `DELETE /site/gallery/:id`

### Google Calendar

- `GET /google-calendar/connect`
- `GET /google-calendar/callback`
- `GET /google-calendar/status`
- `POST /google-calendar/sync`
- `DELETE /google-calendar/disconnect`

## Formato de erro

O backend retorna JSON com `statusCode` e `message`.

Erros internos são convertidos em resposta genérica para não expor detalhes.

## Limitações

- sem versão `/v1`;
- sem OpenAPI commitado;
- sem client tipado gerado;
- Swagger usa versão fixa `1.0`;
- endpoints públicos de procedures ainda declaram bearer auth no Swagger.
