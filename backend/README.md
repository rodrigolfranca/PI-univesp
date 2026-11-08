# Backend - NestJS Modular Monolith

## Description

This API is the backend for our Integration Project App. It is a platform where clients can book appointments with an aesthetic professional. The professional, in turn, can manage their single schedule, employees, as well as the required documents for each service and the related Standard Operating Procedures (here named POPs).

This API coordinates users, clients, professionals, schedules, document templates, sessions, procedures, and POP workflows.

---

## Prerequisites

- **Node.js** (recommended: >= 22.X LTS) - Prefer version 22 for development
- **npm** (Comes with Node.js package)
- **Docker** and **Docker Compose**
- **Git** (For version control and repository cloning)

---

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd PI-univesp/backend
```

2. Set up environment variables:

```bash
cp .env.example .env.dev
```

Fill in the values in `.env.dev` according to your needs.

---

## Development Modes

This project supports two development modes:

---

### 1. Hybrid Mode

In this mode, only PostgreSQL runs inside a Docker container:

- NestJS runs locally on your machine
- PostgreSQL runs in Docker
- Faster hot reload and easier debugging
- Environment variables are loaded via `.env.dev`

#### Install dependencies:

```bash
npm ci
```

#### Start Docker for database usage:

```bash
docker compose --env-file=.env.dev up postgres-service redis-service -d
```

#### Run the application in development mode:

```bash
npm run start:dev
```

---

### 2. Full Docker Mode

In this mode, everything runs inside containers:

- NestJS runs inside a Docker container
- PostgreSQL runs in a separate container
- Hot reload enabled via volume mounting
- Backend waits for PostgreSQL healthcheck before starting
- Environment variables are loaded via `.env.dev`

#### Build and run Docker environment:

```bash
docker compose --env-file .env.dev up --build -d
```

#### Backend Logs:
```bash
docker compose --env-file .env.dev logs -f pi-backend
```

#### Database Logs:
```bash
docker compose --env-file .env.dev logs -f postgres-service
```

#### Database Logs:
```bash
docker compose --env-file .env.dev logs -f redis-service
```

#### Stop Environment

```bash
docker compose -f docker-compose.dev-full.yml --env-file .env.dev down
```

#### Reset environment (clean database)

```bash
docker compose --env-file .env.dev down -v
```

---

## Access

The application ports are defined in `.env.dev`.

Default values:

- Backend: http://localhost:3000
- PostgreSQL: localhost:5432

---

## Integração com o frontend

- `GET /work-schedules` lista os horários de trabalho cadastrados (admin).
- `GET /work-schedules/all` retorna os horários disponíveis calculados.
- `GET /schedules` retorna cliente e profissional com nome/telefone; clientes veem apenas os próprios agendamentos.
- `POST /schedules` aceita admin ou o próprio cliente autenticado (`client_id` igual ao vínculo do usuário).
- `POST /google-calendar/sync` sincroniza um agendamento ou todos; admin only.
- O Google usa cores por status e mantém cancelados como `[CANCELADO]`; exclusão definitiva remove o evento.
- `PATCH` e `DELETE` de agendamentos continuam restritos a admin.
- O callback do Google Agenda redireciona navegadores para a primeira origem de `CORS_ORIGINS` e retorna JSON para clientes de API.
- `schedule_exceptions` aceita `name`; rode `npm run migrate:schedule-exception-name` uma vez por banco.
- `schedules.google_event_link` requer `npm run migrate:google-event-link` uma vez por banco.
