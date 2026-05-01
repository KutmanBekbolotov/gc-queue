# GC Queue Nest

NestJS backend for an intelligent electronic queue platform. The service is being shaped as an API Gateway, orchestration layer, security layer and administrative facade for frontend, Zenoss and Spring Boot integrations.

## Implemented in this iteration

- CRUD modules for branches, departments, services and dynamic department-services bindings
- booking API with validation against department-service availability
- QR inspection, SVG rendering and single-use protection layer
- in-memory audit log for directory changes and booking lifecycle
- health endpoint
- Swagger bootstrap in `main.ts`
- Prisma schema baseline for the target domain model
- Docker and local infrastructure skeleton for PostgreSQL, Redis and RabbitMQ

## Current API groups

- `catalog/department-services` Spring core public catalog gateway
- `public/bookings` Spring core public booking gateway
- `terminal`
- `operator`
- `tv`
- `admin/*` Spring core admin gateway, except `admin/users`
- `management`
- `branches`
- `departments`
- `services`
- `department-services`
- `bookings`
- `qr`
- `auth`
- `admin/users`
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

## Auth

Authentication is delegated to the external Common Auth microservice. This app no longer stores auth users, sessions, password hashes or JWT secrets locally.

Configure the upstream service with:

```bash
AUTH_SERVICE_BASE_URL=http://10.11.13.61
AUTH_SERVICE_TIMEOUT_MS=5000
```

Local proxy endpoints:

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `DELETE /admin/users/:id`
- `PATCH /admin/users/:id/role`

`AuthGuard` is global. Routes marked with `@Public()` stay open; other routes validate the bearer token through Common Auth `/auth/me`. `RolesGuard` is also available through the `@Roles()` decorator.

## Spring Queue Core

NestJS proxies business operations to Spring core and injects the internal actor headers server-side. Browsers, terminals and TV devices must never receive `EQUEUE_CORE_INTERNAL_TOKEN`.

Configure the core integration with:

```bash
EQUEUE_CORE_URL=http://localhost:8080/api
EQUEUE_CORE_INTERNAL_TOKEN=change-me-dev-token
EQUEUE_CORE_TIMEOUT_MS=10000
EQUEUE_TV_CACHE_TTL_MS=2000
```

Initial gateway routes:

- `GET /catalog/department-services?departmentId=...`
- `GET /public/bookings/slots?departmentId=...&serviceId=...&date=2026-05-01`
- `POST /public/bookings`
- `GET /public/bookings/:confirmationCode`
- `POST /public/bookings/:confirmationCode/confirm`
- `POST /public/bookings/:confirmationCode/check-in`
- `POST /public/bookings/:confirmationCode/cancel`
- `POST /terminal/:deviceCode/tickets`
- `POST /terminal/:deviceCode/qr-sessions`
- `GET /terminal/:deviceCode/tickets/:ticketId/print`
- `GET /qr/sessions/validate?token=...`
- `POST /qr/tickets`
- `GET /tv/:deviceCode/snapshot`
- `GET /tv/snapshot?departmentId=...`
- `GET /operator/dashboard`
- `POST /operator/window/available`
- `POST /operator/tickets/next`
- `POST /operator/tickets/:ticketId/:action`
- `GET /operator/tickets/restorable`
- `POST /operator/window/away`

Authenticated admin and manager routes are proxied to `/internal/admin/**`, `/internal/management/**` and `/internal/dashboard/department`. Spring core remains the source of truth for queue state, ticket numbers, bookings and device state.

## QR

QR codes currently encode the booking `qrToken`, so scanners can pass that token to the existing inspection and consume endpoints without coupling the QR image to the future Spring queue-core URL contract.

Local QR endpoints:

- `GET /bookings/:id/qr` returns the booking QR payload
- `GET /bookings/:id/qr.svg` renders the booking QR as SVG
- `GET /qr/:token` inspects a QR token
- `GET /qr/:token.svg` renders an existing QR token as SVG
- `POST /qr/:token/consume` consumes a QR token once

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
