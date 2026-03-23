# GC Queue Nest

NestJS backend for an intelligent electronic queue platform. The service is being shaped as an API Gateway, orchestration layer, security layer and administrative facade for frontend, Zenoss and Spring Boot integrations.

## Implemented in this iteration

- CRUD modules for branches, departments, services and dynamic department-services bindings
- booking API with validation against department-service availability
- QR inspection and single-use protection layer
- in-memory audit log for directory changes and booking lifecycle
- health endpoint
- Swagger bootstrap in `main.ts`
- Prisma schema baseline for the target domain model
- Docker and local infrastructure skeleton for PostgreSQL, Redis and RabbitMQ

## Current API groups

- `branches`
- `departments`
- `services`
- `department-services`
- `bookings`
- `qr`
- `audit`
- `health`

## Quick start

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run start:dev
```

Swagger UI:

```bash
http://localhost:3000/docs
```

Swagger JSON endpoint:

```bash
http://localhost:3000/docs-json
```

Export OpenAPI JSON:

```bash
npm run swagger:export
```

If `API_PREFIX` is set, business routes will be exposed under that prefix.

## Docker

```bash
docker compose up --build
```

Services started by compose:

- NestJS app
- PostgreSQL
- Redis
- RabbitMQ Management

## Prisma

Initial schema is available at `prisma/schema.prisma`. It includes the core entities from the technical specification:

- users / roles / sessions
- branches / departments / windows / services
- department-service dynamic bindings
- devices
- bookings / QR references
- audit logs / alerts / notifications
- operator assignments / access policies

## Notes

- The current implementation still uses in-memory services for runtime CRUD and booking flow.
- Prisma, Redis, RabbitMQ and external integrations are prepared at the project-structure level and should be wired next into persistent application services.
- Swagger UI is exposed at `/docs`, and a static contract can be generated into `openapi.json`.
