# Backend - NestJS Modular Monolith

## Description

This API is the backend for our Integration Project App. It is a platform where clients can book appointments with an aesthetic professional. The professional, in turn, can manage their single schedule, employees, as well as the required documents for each service and the related Standard Operating Procedures (here named POPs).

This API coordinates users, clients, professionals, schedules, document templates, sessions, procedures, and POP workflows.

## Prerequisites

- **Docker Engine** and **Docker Compose**
- **Git**

## Development Architecture

This project is fully containerized for development:

- NestJS runs inside a Docker container
- PostgreSQL runs in a separate container
- Hot reload enabled via volume mounting
- Backend waits for PostgreSQL healthcheck before starting
- Environment variables are loaded via `.env.dev`

## Running on Development Mode

1. **Clone the repository:**

    ```bash
    git clone https://github.com/rodrigolfranca/PI-univesp.git
    cd PI-univesp/backend
    ```

2. **Set up environment variables:**

    ```bash
    cp .env.example .env.dev
    ```

3. **Build and run Docker environment:**

    ```bash
    docker compose --env-file .env.dev up --build -d
    ```

### Access

The application ports are defined in `.env.dev`.

Default values:
- Backend: http://localhost:3000
- PostgreSQL: localhost:5432

### Application Logs

    Backend:
    ```bash
    docker compose --env-file .env.dev logs -f pi-backend
    ```

    Database:
    ```bash
    docker compose --env-file .env.dev logs -f postgres-service
    ```

### Stop Environment

    ```bash
    docker compose --env-file .env.dev down
    ```

### Reset environment (clean database)

```bash
docker compose --env-file .env.dev down -v
```
