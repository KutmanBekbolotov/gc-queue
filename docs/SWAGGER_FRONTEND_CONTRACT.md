# Swagger routes: что frontend отправляет в NestJS

Источник маршрутов: актуальный Nest Swagger/OpenAPI проекта (`npm run swagger:export`, 116 operations). Пути ниже указаны без глобального префикса. Если backend запущен с `API_PREFIX=api`, frontend вызывает эти routes как `/api/...`.

Swagger:

```text
GET /docs
GET /docs-json
```

## Общие правила для frontend

Для JSON routes:

```http
Accept: application/json
Content-Type: application/json
```

`Content-Type` нужен только если есть body.

Для защищенных routes:

```http
Authorization: Bearer <accessToken>
Accept-Language: ru | ky
X-Request-Id: <uuid>
```

Для кабинетов manager/operator дополнительно передавать контекст, когда выбран отдел/окно:

```http
X-Department-Id: <departmentUuid>
X-Window-Id: <windowUuid>
```

Frontend не отправляет `X-Internal-Token`, `X-Actor-Id`, `X-Actor-Role`. Эти headers создает Nest.

Важно: локальные legacy routes в Swagger не везде помечены `ApiBearerAuth`, но глобальный `AuthGuard` все равно защищает все routes без `@Public()`. В таблицах ниже указан фактический доступ.

Форматы:

| Значение | Формат |
| --- | --- |
| Core id | string/UUID |
| Legacy id | number |
| Date | `YYYY-MM-DD`, например `2026-05-11` |
| Time | `HH:mm:ss`, например `09:00:00` |
| ISO datetime | `2026-03-24T09:00:00.000Z` |

## Request body schemas из Swagger

| Schema | Что отправляет frontend |
| --- | --- |
| `LoginDto` | `email*`, `password*` |
| `CreateUserDto` | `email*`, `password*`, `fullName`, `role`, `scopes[]` |
| `UpdateUserDto` | `email`, `fullName`, `isActive`, `isBlocked`, `scopes[]` |
| `UpdateUserRoleDto` | `role*` |
| `CreatePublicBookingDto` | `departmentId*`, `categoryId*`, `serviceId*`, `bookingDate*`, `bookingTime*`, `citizenFullName*` |
| `CreateTerminalTicketDto` | `departmentId*`, `categoryId*`, `serviceId*`, `citizenFullName` |
| `CreateBranchDto` | `code*`, `name*`, `isActive` |
| `UpdateBranchDto` | `code`, `name`, `isActive` |
| `CreateDepartmentDto` | `branchId*`, `code*`, `name*`, `isActive*` |
| `UpdateDepartmentDto` | `branchId`, `code`, `name`, `isActive` |
| `CreateServiceDto` | `code*`, `name*`, `description`, `type: CATEGORY|SERVICE`, `parentId`, `isActive` |
| `UpdateServiceDto` | `code`, `name`, `description`, `type: CATEGORY|SERVICE`, `parentId`, `isActive` |
| `AssignDepartmentServiceDto` | `departmentId*`, `serviceId*`, `isActive`, `bookingEnabled`, `terminalEnabled`, `operatorEnabled`, `priority` |
| `UpdateDepartmentServiceDto` | `isActive`, `bookingEnabled`, `terminalEnabled`, `operatorEnabled`, `priority` |
| `CreateBookingDto` | `branchId*`, `departmentId*`, `serviceId*`, `customerName*`, `customerContact*`, `scheduledAt*`, `notes` |
| `CancelBookingDto` | `reason` |

`*` означает обязательное поле по Swagger/DTO.

## Proxy routes к Spring core

У routes `core admin`, `core management`, части `core operator`, `core tickets`, `core analytics`, `core audit`, `core qr`, `core terminal` Nest часто принимает `Record<string, unknown>` и проксирует в Spring core. Поэтому:

- `GET` routes отправляют query params;
- `POST`, `PUT`, `PATCH`, `DELETE` могут отправлять JSON body;
- все query params прокидываются дальше в Spring;
- точную форму body для таких routes нужно брать из Spring Swagger для соответствующего `/internal/**` route;
- если body не нужен, frontend может отправить `{}` или не отправлять body, если UI/client это поддерживает.

## System, auth, users, local audit

| Method | Route | Доступ | Что frontend отправляет |
| --- | --- | --- | --- |
| `GET` | `/health` | public | Ничего. |
| `GET` | `/audit` | bearer | Query filters: `actorId`, `actorType`, `action`, `entityType`, `entityId`, `correlationId` optional. |
| `POST` | `/auth/login` | public | Body `LoginDto`. |
| `GET` | `/auth/me` | bearer | Только `Authorization`. |
| `POST` | `/auth/logout` | bearer | Только `Authorization`; Nest берет текущий bearer token. |
| `GET` | `/admin/users` | bearer, права проверяет Common Auth | Только `Authorization`. |
| `POST` | `/admin/users` | bearer, права проверяет Common Auth | Body `CreateUserDto`. |
| `PATCH` | `/admin/users/{id}` | bearer, права проверяет Common Auth | Path `id`, body `UpdateUserDto`. |
| `DELETE` | `/admin/users/{id}` | bearer, права проверяет Common Auth | Path `id`. |
| `PATCH` | `/admin/users/{id}/role` | bearer, права проверяет Common Auth | Path `id`, body `UpdateUserRoleDto`. |

## Public Spring core routes

| Method | Route | Доступ | Что frontend отправляет |
| --- | --- | --- | --- |
| `GET` | `/catalog/department-services` | public | Query `departmentId*`. |
| `GET` | `/public/bookings/slots` | public | Query `departmentId*`, `serviceId*`, `date*`. |
| `POST` | `/public/bookings` | public | Body `CreatePublicBookingDto`. |
| `GET` | `/public/bookings/{confirmationCode}` | public | Path `confirmationCode`. |
| `POST` | `/public/bookings/{confirmationCode}/confirm` | public | Path `confirmationCode`, body не нужен. |
| `POST` | `/public/bookings/{confirmationCode}/check-in` | public | Path `confirmationCode`, body не нужен. |
| `POST` | `/public/bookings/{confirmationCode}/cancel` | public | Path `confirmationCode`, body проксируется в Spring, обычно `{ "reason": "..." }`. |
| `GET` | `/qr/sessions/validate` | public | Query `token*`. |
| `POST` | `/qr/tickets` | public | Body проксируется в Spring, обычно `token*` и данные посетителя. |
| `POST` | `/terminal/{deviceCode}/tickets` | public terminal | Path `deviceCode`, body `CreateTerminalTicketDto`. |
| `POST` | `/terminal/{deviceCode}/qr-sessions` | public terminal | Path `deviceCode`, body проксируется в Spring, часто `{}`. |
| `GET` | `/terminal/{deviceCode}/tickets/{ticketId}/print` | public terminal | Path `deviceCode`, `ticketId`. |
| `GET` | `/tv/snapshot` | public TV | Query проксируется в Spring; обычно `departmentId`. |
| `GET` | `/tv/{deviceCode}/snapshot` | public TV | Path `deviceCode`. |

## Protected Spring core admin routes

Роли: `ADMIN | SUPER_ADMIN`.

`resource` может быть только:

```text
branches
departments
categories
services
```

| Method | Route | Что frontend отправляет |
| --- | --- | --- |
| `GET` | `/admin/{resource}` | Path `resource`, query Spring filters/pagination. |
| `POST` | `/admin/{resource}` | Path `resource`, body Spring DTO для создания. |
| `PUT` | `/admin/{resource}` | Path `resource`, body Spring DTO. |
| `PATCH` | `/admin/{resource}` | Path `resource`, body Spring DTO. |
| `DELETE` | `/admin/{resource}` | Path `resource`, query/body если требует Spring. |
| `GET` | `/admin/{resource}/{id}` | Path `resource`, `id`, query optional. |
| `POST` | `/admin/{resource}/{id}` | Path `resource`, `id`, body Spring DTO/action payload. |
| `PUT` | `/admin/{resource}/{id}` | Path `resource`, `id`, body Spring DTO. |
| `PATCH` | `/admin/{resource}/{id}` | Path `resource`, `id`, body Spring DTO. |
| `DELETE` | `/admin/{resource}/{id}` | Path `resource`, `id`, body optional. |
| `GET` | `/admin/departments/{departmentId}/services/{serviceId}` | Path `departmentId`, `serviceId`. |
| `POST` | `/admin/departments/{departmentId}/services/{serviceId}` | Path ids, body Spring assignment payload or `{}`. |
| `PUT` | `/admin/departments/{departmentId}/services/{serviceId}` | Path ids, body Spring assignment payload. |
| `PATCH` | `/admin/departments/{departmentId}/services/{serviceId}` | Path ids, body Spring assignment payload. |
| `DELETE` | `/admin/departments/{departmentId}/services/{serviceId}` | Path ids, body optional. |

## Protected Spring core management routes

Роли: `MANAGER | ADMIN | SUPER_ADMIN`.

`resource` для collection routes:

```text
employees
halls
windows
terminals
tv-devices
work-schedules
reject-reasons
no-show-reasons
```

`resource` для item routes:

```text
employees
halls
windows
terminals
tv-devices
reject-reasons
no-show-reasons
```

| Method | Route | Что frontend отправляет |
| --- | --- | --- |
| `GET` | `/management/departments/{departmentId}/{resource}` | Path `departmentId`, `resource`, query Spring filters/pagination. |
| `POST` | `/management/departments/{departmentId}/{resource}` | Path values, body Spring DTO для создания. |
| `PUT` | `/management/departments/{departmentId}/{resource}` | Path values, body Spring DTO. Особенно для `work-schedules`. |
| `PATCH` | `/management/departments/{departmentId}/{resource}` | Path values, body Spring DTO. |
| `DELETE` | `/management/departments/{departmentId}/{resource}` | Path values, query/body если требует Spring. |
| `GET` | `/management/departments/{departmentId}/{resource}/{id}` | Path `departmentId`, `resource`, `id`. |
| `POST` | `/management/departments/{departmentId}/{resource}/{id}` | Path values, body Spring DTO/action payload. |
| `PUT` | `/management/departments/{departmentId}/{resource}/{id}` | Path values, body Spring DTO. |
| `PATCH` | `/management/departments/{departmentId}/{resource}/{id}` | Path values, body Spring DTO. |
| `DELETE` | `/management/departments/{departmentId}/{resource}/{id}` | Path values, body optional. |
| `GET` | `/management/employees/{employeeId}/services/{serviceId}` | Path `employeeId`, `serviceId`. |
| `POST` | `/management/employees/{employeeId}/services/{serviceId}` | Path ids, body Spring assignment payload or `{}`. |
| `PUT` | `/management/employees/{employeeId}/services/{serviceId}` | Path ids, body Spring assignment payload. |
| `PATCH` | `/management/employees/{employeeId}/services/{serviceId}` | Path ids, body Spring assignment payload. |
| `DELETE` | `/management/employees/{employeeId}/services/{serviceId}` | Path ids, body optional. |
| `GET` | `/management/employees/{employeeId}/windows/{windowId}` | Path `employeeId`, `windowId`. |
| `POST` | `/management/employees/{employeeId}/windows/{windowId}` | Path ids, body Spring assignment payload or `{}`. |
| `PUT` | `/management/employees/{employeeId}/windows/{windowId}` | Path ids, body Spring assignment payload. |
| `PATCH` | `/management/employees/{employeeId}/windows/{windowId}` | Path ids, body Spring assignment payload. |
| `DELETE` | `/management/employees/{employeeId}/windows/{windowId}` | Path ids, body optional. |

## Protected Spring core dashboard/operator/tickets

| Method | Route | Доступ | Что frontend отправляет |
| --- | --- | --- | --- |
| `GET` | `/dashboard/admin` | `ADMIN | SUPER_ADMIN` | Только `Authorization`. |
| `GET` | `/dashboard/department` | `MANAGER | ADMIN | SUPER_ADMIN` | Query `departmentId` optional, но обычно нужен. |
| `GET` | `/operator/dashboard` | `OPERATOR` | `Authorization`, `X-Department-Id`, `X-Window-Id`. |
| `POST` | `/operator/window/available` | `OPERATOR` | Headers operator context, body Spring payload или `{}`. |
| `POST` | `/operator/window/away` | `OPERATOR` | Headers operator context, body Spring payload или `{}`. |
| `POST` | `/operator/tickets/next` | `OPERATOR` | Headers operator context, body Spring payload или `{}`. |
| `GET` | `/operator/tickets/restorable` | `OPERATOR` | Headers operator context, query Spring filters optional. |
| `POST` | `/operator/tickets/{ticketId}/{action}` | `OPERATOR` | Path `ticketId`, `action`; body Spring action payload. `action`: `recall`, `start`, `complete`, `no-show`, `reject`, `restore`. |
| `POST` | `/tickets` | `OPERATOR | MANAGER | ADMIN | SUPER_ADMIN` | Body Spring ticket create payload; if body has `departmentId`, Nest uses it as actor department. |
| `GET` | `/tickets/query/waiting` | `OPERATOR | MANAGER | ADMIN | SUPER_ADMIN` | Query Spring filters; usually `departmentId`, `limit`. |
| `GET` | `/tickets/query/operator/current` | `OPERATOR | MANAGER | ADMIN | SUPER_ADMIN` | Headers with user/window context. |
| `GET` | `/tickets/query/by-number` | `OPERATOR | MANAGER | ADMIN | SUPER_ADMIN` | Query Spring filters; usually `departmentId`, `ticketNumber`, `date`. |
| `GET` | `/tickets/query/{ticketId}/history` | `OPERATOR | MANAGER | ADMIN | SUPER_ADMIN` | Path `ticketId`. |
| `GET` | `/tickets/print` | `OPERATOR | MANAGER | ADMIN | SUPER_ADMIN` | Query Spring filters; usually `departmentId`, `ticketNumber`, `date`. |
| `GET` | `/tickets/{ticketId}/print` | `OPERATOR | MANAGER | ADMIN | SUPER_ADMIN` | Path `ticketId`. |

## Protected Spring core analytics, reports, audit, maintenance

| Method | Route | Доступ | Что frontend отправляет |
| --- | --- | --- | --- |
| `GET` | `/analytics/department-load` | `AUDITOR | MANAGER | ADMIN | SUPER_ADMIN` | Query Spring filters; usually `departmentId`, `from`, `to`. |
| `GET` | `/analytics/operator-stats` | `AUDITOR | MANAGER | ADMIN | SUPER_ADMIN` | Query Spring filters; usually `departmentId`, `from`, `to`. |
| `GET` | `/analytics/summary` | `AUDITOR | MANAGER | ADMIN | SUPER_ADMIN` | Query Spring filters; usually `departmentId`, `from`, `to`. |
| `POST` | `/analytics/recalculate` | `AUDITOR | MANAGER | ADMIN | SUPER_ADMIN` | Query Spring params; usually `departmentId`, `date`. |
| `GET` | `/audit/logs` | `AUDITOR | MANAGER | ADMIN | SUPER_ADMIN` | Query Spring filters; usually `departmentId`, `limit`, date filters. |
| `GET` | `/audit/logs/by-actor` | `AUDITOR | MANAGER | ADMIN | SUPER_ADMIN` | Query Spring filters; usually `actorId`, `departmentId`, `limit`. |
| `GET` | `/reports/department-load.xlsx` | `AUDITOR | MANAGER | ADMIN | SUPER_ADMIN` | Query Spring filters; response is XLSX blob, not JSON. |
| `POST` | `/maintenance/run` | `ADMIN | SUPER_ADMIN` | Body не нужен. |

## Legacy local branches/services/departments

Эти routes работают с in-memory/local слоями Nest и используют numeric ids. Для реальной очереди предпочтителен Spring core через `/admin/**`, `/management/**`, `/public/bookings/**`, `/terminal/**`, `/operator/**`, `/tickets/**`.

| Method | Route | Доступ | Что frontend отправляет |
| --- | --- | --- | --- |
| `POST` | `/branches` | bearer | Body `CreateBranchDto`. |
| `GET` | `/branches` | public | Ничего. |
| `GET` | `/branches/{id}` | public | Path numeric `id`. |
| `PATCH` | `/branches/{id}` | bearer | Path numeric `id`, body `UpdateBranchDto`. |
| `DELETE` | `/branches/{id}` | bearer | Path numeric `id`. |
| `POST` | `/services` | bearer | Body `CreateServiceDto`. |
| `GET` | `/services` | public | Ничего. |
| `GET` | `/services/{id}` | public | Path numeric `id`. |
| `PATCH` | `/services/{id}` | bearer | Path numeric `id`, body `UpdateServiceDto`. |
| `DELETE` | `/services/{id}` | bearer | Path numeric `id`. |
| `POST` | `/departments` | bearer | Body `CreateDepartmentDto`. |
| `GET` | `/departments` | public | Ничего. |
| `GET` | `/departments/{id}` | public | Path numeric `id`. |
| `PATCH` | `/departments/{id}` | bearer | Path numeric `id`, body `UpdateDepartmentDto`. |
| `DELETE` | `/departments/{id}` | bearer | Path numeric `id`. |

## Legacy local department-services

| Method | Route | Доступ | Что frontend отправляет |
| --- | --- | --- | --- |
| `POST` | `/department-services/assign` | bearer | Body `AssignDepartmentServiceDto`. |
| `POST` | `/department-services/unassign` | bearer | Body with at least `departmentId*`, `serviceId*`; other fields ignored. |
| `GET` | `/department-services/by-department/{departmentId}` | public | Path numeric `departmentId`. |
| `GET` | `/department-services/by-department/{departmentId}/services` | public | Path numeric `departmentId`, query `channel: booking|terminal|operator` optional. |
| `GET` | `/department-services/by-service/{serviceId}` | public | Path numeric `serviceId`. |
| `GET` | `/department-services/by-service/{serviceId}/departments` | public | Path numeric `serviceId`, query `channel: booking|terminal|operator` optional. |
| `PATCH` | `/department-services/{id}` | bearer | Path numeric `id`, body `UpdateDepartmentServiceDto`. |
| `DELETE` | `/department-services/{id}` | bearer | Path numeric `id`. |

## Legacy local bookings and QR

| Method | Route | Доступ | Что frontend отправляет |
| --- | --- | --- | --- |
| `GET` | `/bookings/slots` | public | Query numeric `branchId*`, `departmentId*`, `serviceId*`, `date*`. |
| `POST` | `/bookings` | public | Body `CreateBookingDto`. |
| `GET` | `/bookings` | bearer | Ничего. |
| `GET` | `/bookings/{id}/qr` | public | Path numeric `id`. |
| `GET` | `/bookings/{id}/qr.svg` | public | Path numeric `id`; response `image/svg+xml`. |
| `GET` | `/bookings/{id}` | public | Path numeric `id`. |
| `PATCH` | `/bookings/{id}/confirm` | bearer | Path numeric `id`, body не нужен. |
| `PATCH` | `/bookings/{id}/cancel` | bearer | Path numeric `id`, body `CancelBookingDto`. |
| `GET` | `/qr/{token}.svg` | public | Path `token`; response `image/svg+xml`. |
| `GET` | `/qr/{token}` | public | Path `token`. |
| `POST` | `/qr/{token}/consume` | bearer | Path `token`, body не нужен. |

