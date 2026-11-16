# Modelo de dados

## Entidades principais

| Entidade              | Tabela                    | Papel                                             |
| --------------------- | ------------------------- | ------------------------------------------------- |
| User                  | `users`                   | Identidade, nome, telefone, e-mail e confirmações |
| Client                | `clients`                 | Vínculo de cliente                                |
| Professional          | `professionals`           | Vínculo profissional, admin e conexão Google      |
| Category              | `categories`              | Categorias de procedimentos                       |
| Procedure             | `procedures`              | Serviço configurável                              |
| ProcedureProfessional | `procedure_professionals` | Vínculo N:N entre procedimento e profissional     |
| WorkSchedule          | `work_schedules`          | Disponibilidade semanal recorrente                |
| ScheduleException     | `schedule_exceptions`     | Abertura ou bloqueio por data                     |
| Schedule              | `schedules`               | Agendamento concreto                              |
| Pop                   | `pops`                    | Documento PDF                                     |
| SiteBrand             | `site_brand`              | Identidade da marca                               |
| GalleryImage          | `gallery_images`          | Imagens da galeria                                |
| Session               | `sessions`                | Modelo legado, sem uso na aplicação               |
| DocumentTemplates     | `document_templates`      | Modelo legado, sem uso                            |

## Relações

```text
User 1---0..1 Client
User 1---0..1 Professional
Professional N---N Procedure
Category 1---N Procedure
Procedure 1---N Pop
Procedure 1---N Schedule
Professional 1---N Schedule
Professional 1---N WorkSchedule
Professional 1---N ScheduleException
Client 1---N Schedule
```

## Campos relevantes

### User

- `phone_number`: identidade de login;
- `phone_number_confirmed`;
- `email` único;
- `email_confirmed`.

### Professional

- `is_admin`;
- `google_refresh_token` cifrado;
- `google_calendar_id`, padrão `primary`.

### Schedule

- `procedure_id`, `professional_id`, `client_id`;
- `date`, `start_time`, `session`;
- `status`: `scheduled`, `completed`, `canceled`, `absent`;
- `google_event_id`, `google_event_link`.

### WorkSchedule

- `day_of_week` de 0 a 6;
- `start_time`, `end_time`.

### ScheduleException

- `type`: `open` ou `blocked`;
- `date`;
- `start_time`, `end_time`;
- `name`.

## Integridade e lacunas

- `users.phone_number` não possui constraint única.
- `clients.user_id` e `professionals.user_id` não possuem constraint única.
- `schedules` não possui constraint contra sobreposição.
- `work_schedules` não possui constraint de não sobreposição.
- `schedule_exceptions` não possui constraint de duplicidade.
- `Procedure.price` usa `FLOAT`, não `DECIMAL`.
- Alguns relacionamentos dependem de `sequelize.sync()`, não das migrações.
- `Schedule.document_id` não possui associação ativa.
- `Session` e `DocumentTemplates` são legados sem uso.

## Modelos legados

- `Session`: não usado pelo fluxo atual.
- `DocumentTemplates`: não usado; `Schedule.document_id` é órfão.
- `sessions` e `bloqueio_periodo` de procedimentos não são aplicados integralmente.

## Migrações

O schema inicial é criado por `sequelize.sync()` em desenvolvimento. Em produção, `DB_SYNC=false`.

As migrações atuais são scripts idempotentes de SQL, sem ledger de versões, sem down migration e sem ordem formal registrada.

Ver [Migrações](../operations/migrations.md).
