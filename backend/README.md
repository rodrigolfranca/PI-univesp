# Backend - NestJS Modular Monolith

## Description

This API serves as the backend for our Integration Project App. It is a platform where clients can book appointments with an aesthetic professional. The professional, in turn, can manage their single schedule, employees, as well as the required documents for each service and the related Standard Operating Procedures (here named POPs).

This API coordinates users, clients, professionals, schedules, document templates, sessions, procedures, and POP workflows.

## Prerequisites

- **Node.js** (recommended: >= 22.X LTS) - Prefer version 22 for development
- **npm** (Comes with Node.js package)
- **Docker** and **Docker Compose**
- **Git** (For version control and repository cloning)

## Installation

1. **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd PI-univesp/backend
    ```

2. **Install dependencies:**

    ```bash
    npm ci
    ```

3. **Set up environment variables:**
   Copy `.env.example` to `.env.dev` and fill in the values according to your needs.

4. **Start Docker for database usage:**

    ```bash
    docker compose --env-file=.env.dev up postgres-service -d
    ```

5. **Run the application in development mode:**
    ```bash
    npm run start:dev
    ```

## Running the Application

### Local Development

```bash
# build tsc
$ npm run build

# development
$ npm run start:dev

# production
$ npm run start
```

> **On Windows, add `:w` at the end of the command.**<br>
> Example: `npm run start:dev:w`

## Main Scripts

- `npm run start` Starts the application in production mode
- `npm run start:dev` Starts the application in development mode
