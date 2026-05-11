# Полная инструкция по использованию GC Queue Nest + Spring Core

Эта инструкция описывает, как пользоваться всей системой после интеграции NestJS gateway, Common Auth, Spring `equeue-engine` и frontend.

## 1. Что есть в системе

Архитектура:

```text
Frontend / Terminal / TV
        |
        v
NestJS gateway: http://10.11.13.50:3000/api
        |
        +--> Common Auth: https://auth-api.tsvs.kg
        |
        +--> Spring queue core: http://10.11.13.50:18080/api/internal/**
```

Правило безопасности:

- frontend ходит только в NestJS;
- frontend не ходит напрямую в Spring `/internal/**`;
- frontend не знает `EQUEUE_CORE_INTERNAL_TOKEN`;
- Nest проверяет пользователя через Common Auth;
- Nest превращает пользователя/устройство в Spring headers `X-Actor-*`;
- Spring хранит очередь, талоны, бронирования, окна, устройства, аналитику и отчеты.

## 2. Основные URL

Если `API_PREFIX=api`, все backend routes доступны под `/api`.

Основной Nest gateway:

```text
http://10.11.13.50:3000/api
```

Локально:

```text
http://localhost:3000/api
```

Health Nest:

```text
GET http://10.11.13.50:3000/api/health
```

Swagger Nest:

```text
http://10.11.13.50:3000/docs
```

Полный список Swagger routes и то, что frontend должен отправлять в path/query/body/headers:

```text
docs/SWAGGER_FRONTEND_CONTRACT.md
```

Spring health:

```text
GET http://10.11.13.50:18080/api/actuator/health
```

Spring Swagger:

```text
http://10.11.13.50:18080/api/swagger-ui/index.html
```

Common Auth:

```text
https://auth-api.tsvs.kg
```

## 3. Файлы конфигурации

Главный файл для запуска:

```text
.env
```

Пример:

```env
PORT=3000
API_PREFIX=api
APP_HOST_PORT=3000

AUTH_SERVICE_BASE_URL=https://auth-api.tsvs.kg
AUTH_SERVICE_TIMEOUT_MS=5000

EQUEUE_CORE_URL=http://10.11.13.50:18080/api
EQUEUE_CORE_INTERNAL_TOKEN=<spring-app-internal-token>
EQUEUE_CORE_TIMEOUT_MS=10000
EQUEUE_TV_CACHE_TTL_MS=2000
```

Важно:

- настоящий `EQUEUE_CORE_INTERNAL_TOKEN` хранить только в `.env`;
- `.env` не коммитить;
- `.env.example` содержит только пример;
- `docker-compose.yml` передает контейнеру именно `.env`;
- `.dockerignore` не копирует `.env` внутрь Docker image.

## 4. Первый запуск

Установить зависимости:

```bash
npm install
```

Создать `.env`, если его еще нет:

```bash
cp .env.example .env
```

Заполнить в `.env`:

```env
AUTH_SERVICE_BASE_URL=https://auth-api.tsvs.kg
EQUEUE_CORE_URL=http://10.11.13.50:18080/api
EQUEUE_CORE_INTERNAL_TOKEN=<реальный токен Spring APP_INTERNAL_TOKEN>
```

Запуск локально без Docker:

```bash
npm run start:dev
```

Запуск через Docker:

```bash
docker compose up -d --build
```

Если контейнер уже был запущен и ты поменял `.env`, пересоздай app:

```bash
docker compose up -d --build --force-recreate app
```

Проверить, что контейнер получил правильные env:

```bash
docker compose exec app printenv AUTH_SERVICE_BASE_URL
docker compose exec app printenv EQUEUE_CORE_URL
docker compose exec app printenv EQUEUE_CORE_INTERNAL_TOKEN
```

Посмотреть логи:

```bash
docker compose logs -f app
```

## 5. Быстрая проверка после запуска

Проверить Nest:

```bash
curl http://10.11.13.50:3000/api/health
```

Ожидаемо:

```json
{
  "status": "ok",
  "service": "gc-queue-nest"
}
```

Проверить Spring:

```bash
curl http://10.11.13.50:18080/api/actuator/health
```

Ожидаемо:

```json
{
  "status": "UP"
}
```

Проверить Common Auth:

```bash
curl -i https://auth-api.tsvs.kg/auth/me \
  -H 'Authorization: Bearer fake-token'
```

Ожидаемо `401` JSON, а не HTML и не network error. Это значит, что auth API доступен.

Проверить CORS preflight:

```bash
curl -i -X OPTIONS http://10.11.13.50:3000/api/admin/branches \
  -H 'Origin: http://localhost:3030' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: authorization,content-type,x-request-id'
```

Ожидаемо:

```text
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: *
```

## 6. Авторизация пользователя

Login:

```bash
curl -X POST http://10.11.13.50:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@gmail.com",
    "password": "<password>"
  }'
```

Ответ зависит от Common Auth, обычно содержит access token:

```json
{
  "accessToken": "...",
  "tokenType": "Bearer"
}
```

Дальше frontend и curl должны отправлять:

```http
Authorization: Bearer <accessToken>
Accept-Language: ru
X-Request-Id: <uuid>
```

Проверить текущего пользователя:

```bash
curl http://10.11.13.50:3000/api/auth/me \
  -H 'Authorization: Bearer <accessToken>'
```

Если токен рабочий, ответ будет примерно:

```json
{
  "id": "...",
  "email": "admin@gmail.com",
  "role": "ADMIN",
  "roles": ["ADMIN"],
  "scopes": []
}
```

Logout:

```bash
curl -X POST http://10.11.13.50:3000/api/auth/logout \
  -H 'Authorization: Bearer <accessToken>'
```

## 7. Роли

Роли приходят из Common Auth и проверяются в Nest.

```text
SUPER_ADMIN
ADMIN
AUDITOR
MANAGER
OPERATOR
TERMINAL
TV
SYSTEM
```

Кто что может:

| Роль | Что делает |
| --- | --- |
| `SUPER_ADMIN` | полный доступ к admin, management, analytics |
| `ADMIN` | справочники, пользователи, management, analytics |
| `MANAGER` | dashboard и управление своим отделением |
| `OPERATOR` | рабочее место оператора |
| `AUDITOR` | аудит, аналитика, отчеты |
| `TERMINAL` | роль Spring для терминалов, Nest создает ее сам |
| `TV` | роль Spring для TV, Nest создает ее сам |
| `SYSTEM` | публичные/system операции, Nest создает ее сам |

Если нет токена:

```text
401 Missing bearer token
```

Если токен есть, но роль не подходит:

```text
403 Insufficient role
```

## 8. Headers, которые использует frontend

Обычные защищенные запросы:

```http
Authorization: Bearer <accessToken>
Accept: application/json
Accept-Language: ru
X-Request-Id: <uuid>
```

Для manager/operator context:

```http
X-Department-Id: <departmentUuid>
X-Window-Id: <windowUuid>
```

`X-Window-Id` нужен только оператору.

Frontend не отправляет:

```http
X-Internal-Token
X-Actor-Id
X-Actor-Role
```

Эти headers создает Nest.

## 9. Public booking flow

Используется публичным сайтом записи.

Получить услуги отделения:

```bash
curl 'http://10.11.13.50:3000/api/catalog/department-services?departmentId=00000000-0000-0000-0000-000000000301' \
  -H 'Accept-Language: ru'
```

Получить слоты:

```bash
curl 'http://10.11.13.50:3000/api/public/bookings/slots?departmentId=00000000-0000-0000-0000-000000000301&serviceId=00000000-0000-0000-0000-000000000401&date=2026-05-11' \
  -H 'Accept-Language: ru'
```

Создать запись:

```bash
curl -X POST http://10.11.13.50:3000/api/public/bookings \
  -H 'Content-Type: application/json' \
  -H 'Accept-Language: ru' \
  -d '{
    "departmentId": "00000000-0000-0000-0000-000000000301",
    "categoryId": "00000000-0000-0000-0000-000000000101",
    "serviceId": "00000000-0000-0000-0000-000000000401",
    "bookingDate": "2026-05-11",
    "bookingTime": "09:00:00",
    "citizenFullName": "Иванов Иван"
  }'
```

Получить запись по коду:

```bash
curl http://10.11.13.50:3000/api/public/bookings/<confirmationCode>
```

Подтвердить:

```bash
curl -X POST http://10.11.13.50:3000/api/public/bookings/<confirmationCode>/confirm
```

Check-in:

```bash
curl -X POST http://10.11.13.50:3000/api/public/bookings/<confirmationCode>/check-in
```

Отменить:

```bash
curl -X POST http://10.11.13.50:3000/api/public/bookings/<confirmationCode>/cancel \
  -H 'Content-Type: application/json' \
  -d '{"reason":"Не смогу прийти"}'
```

## 10. Terminal flow

Терминал знает свой `deviceCode`, например:

```text
TERM-BIRIMDIK-001
```

Создать талон:

```bash
curl -X POST http://10.11.13.50:3000/api/terminal/TERM-BIRIMDIK-001/tickets \
  -H 'Content-Type: application/json' \
  -H 'Accept-Language: ru' \
  -d '{
    "departmentId": "00000000-0000-0000-0000-000000000301",
    "categoryId": "00000000-0000-0000-0000-000000000101",
    "serviceId": "00000000-0000-0000-0000-000000000401",
    "citizenFullName": "Иванов Иван"
  }'
```

Ответ Spring содержит:

```json
{
  "id": "...",
  "ticketNumber": "0023",
  "status": "WAITING",
  "ticketDate": "2026-05-11",
  "ticketTime": "10:15:30",
  "peopleAheadCount": 4,
  "waitingBeforeCount": 4
}
```

Для UI и печати использовать `peopleAheadCount`.

Печать талона:

```bash
curl http://10.11.13.50:3000/api/terminal/TERM-BIRIMDIK-001/tickets/<ticketId>/print
```

Создать QR session:

```bash
curl -X POST http://10.11.13.50:3000/api/terminal/TERM-BIRIMDIK-001/qr-sessions \
  -H 'Content-Type: application/json' \
  -d '{}'
```

## 11. QR session flow

Проверить QR token:

```bash
curl 'http://10.11.13.50:3000/api/qr/sessions/validate?token=<token>'
```

Создать талон из QR session:

```bash
curl -X POST http://10.11.13.50:3000/api/qr/tickets \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "<token>",
    "citizenFullName": "Иванов Иван"
  }'
```

Точную форму body для QR ticket сверять со Spring Swagger.

## 12. TV display flow

TV по отделению:

```bash
curl 'http://10.11.13.50:3000/api/tv/snapshot?departmentId=00000000-0000-0000-0000-000000000301' \
  -H 'Accept-Language: ru'
```

TV по device code:

```bash
curl http://10.11.13.50:3000/api/tv/TV-BIRIMDIK-001/snapshot \
  -H 'Accept-Language: ru'
```

Nest кэширует TV snapshot на `EQUEUE_TV_CACHE_TTL_MS`, сейчас обычно `2000 ms`.

Рекомендация для frontend TV:

- polling каждые 2-5 секунд;
- не хранить состояние очереди локально как source of truth;
- всегда перерисовывать из snapshot.

## 13. Operator workplace flow

Нужен пользователь с ролью `OPERATOR`.

Обязательные headers:

```http
Authorization: Bearer <operatorAccessToken>
X-Department-Id: <departmentUuid>
X-Window-Id: <windowUuid>
Accept-Language: ru
```

Открыть dashboard:

```bash
curl http://10.11.13.50:3000/api/operator/dashboard \
  -H 'Authorization: Bearer <operatorAccessToken>' \
  -H 'X-Department-Id: 00000000-0000-0000-0000-000000000301' \
  -H 'X-Window-Id: 00000000-0000-0000-0000-000000000601'
```

Пометить окно доступным:

```bash
curl -X POST http://10.11.13.50:3000/api/operator/window/available \
  -H 'Authorization: Bearer <operatorAccessToken>' \
  -H 'X-Department-Id: 00000000-0000-0000-0000-000000000301' \
  -H 'X-Window-Id: 00000000-0000-0000-0000-000000000601' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Вызвать следующий талон:

```bash
curl -X POST http://10.11.13.50:3000/api/operator/tickets/next \
  -H 'Authorization: Bearer <operatorAccessToken>' \
  -H 'X-Department-Id: 00000000-0000-0000-0000-000000000301' \
  -H 'X-Window-Id: 00000000-0000-0000-0000-000000000601' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Действия по талону:

```bash
curl -X POST http://10.11.13.50:3000/api/operator/tickets/<ticketId>/recall ...
curl -X POST http://10.11.13.50:3000/api/operator/tickets/<ticketId>/start ...
curl -X POST http://10.11.13.50:3000/api/operator/tickets/<ticketId>/complete ...
curl -X POST http://10.11.13.50:3000/api/operator/tickets/<ticketId>/no-show ...
curl -X POST http://10.11.13.50:3000/api/operator/tickets/<ticketId>/reject ...
curl -X POST http://10.11.13.50:3000/api/operator/tickets/<ticketId>/restore ...
```

Получить восстановимые талоны:

```bash
curl http://10.11.13.50:3000/api/operator/tickets/restorable \
  -H 'Authorization: Bearer <operatorAccessToken>' \
  -H 'X-Department-Id: 00000000-0000-0000-0000-000000000301' \
  -H 'X-Window-Id: 00000000-0000-0000-0000-000000000601'
```

Уйти с окна:

```bash
curl -X POST http://10.11.13.50:3000/api/operator/window/away \
  -H 'Authorization: Bearer <operatorAccessToken>' \
  -H 'X-Department-Id: 00000000-0000-0000-0000-000000000301' \
  -H 'X-Window-Id: 00000000-0000-0000-0000-000000000601' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

## 14. Manager dashboard

Нужна роль:

```text
MANAGER | ADMIN | SUPER_ADMIN
```

Dashboard отделения:

```bash
curl 'http://10.11.13.50:3000/api/dashboard/department?departmentId=00000000-0000-0000-0000-000000000301' \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Accept-Language: ru'
```

Admin dashboard:

```bash
curl http://10.11.13.50:3000/api/dashboard/admin \
  -H 'Authorization: Bearer <adminAccessToken>'
```

## 15. Admin справочники

Нужна роль:

```text
ADMIN | SUPER_ADMIN
```

Поддержанные resources:

```text
branches
departments
categories
services
```

Список филиалов:

```bash
curl http://10.11.13.50:3000/api/admin/branches \
  -H 'Authorization: Bearer <adminAccessToken>' \
  -H 'Accept-Language: ru'
```

Создать филиал:

```bash
curl -X POST http://10.11.13.50:3000/api/admin/branches \
  -H 'Authorization: Bearer <adminAccessToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "code": "BR-001",
    "nameRu": "Филиал",
    "nameKy": "Филиал"
  }'
```

Обновить:

```bash
curl -X PATCH http://10.11.13.50:3000/api/admin/branches/<branchId> \
  -H 'Authorization: Bearer <adminAccessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"nameRu":"Новое название"}'
```

Привязать услугу к отделению:

```bash
curl -X POST http://10.11.13.50:3000/api/admin/departments/<departmentId>/services/<serviceId> \
  -H 'Authorization: Bearer <adminAccessToken>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Отвязать услугу:

```bash
curl -X DELETE http://10.11.13.50:3000/api/admin/departments/<departmentId>/services/<serviceId> \
  -H 'Authorization: Bearer <adminAccessToken>'
```

Body для admin routes проксируется в Spring. Точную форму сверять в Spring Swagger.

## 16. Management отделения

Нужна роль:

```text
MANAGER | ADMIN | SUPER_ADMIN
```

Поддержанные resources:

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

Коллекции:

```bash
curl http://10.11.13.50:3000/api/management/departments/<departmentId>/windows \
  -H 'Authorization: Bearer <accessToken>'
```

Создание:

```bash
curl -X POST http://10.11.13.50:3000/api/management/departments/<departmentId>/windows \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Обновление item:

```bash
curl -X PATCH http://10.11.13.50:3000/api/management/departments/<departmentId>/windows/<windowId> \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Назначить услугу сотруднику:

```bash
curl -X POST http://10.11.13.50:3000/api/management/employees/<employeeId>/services/<serviceId> \
  -H 'Authorization: Bearer <accessToken>'
```

Назначить окно сотруднику:

```bash
curl -X POST http://10.11.13.50:3000/api/management/employees/<employeeId>/windows/<windowId> \
  -H 'Authorization: Bearer <accessToken>'
```

Для `work-schedules` Spring использует:

```text
GET /management/departments/{departmentId}/work-schedules
PUT /management/departments/{departmentId}/work-schedules
```

## 17. Tickets query endpoints

Нужна роль:

```text
OPERATOR | MANAGER | ADMIN | SUPER_ADMIN
```

Ожидающие:

```bash
curl 'http://10.11.13.50:3000/api/tickets/query/waiting?departmentId=00000000-0000-0000-0000-000000000301&limit=20' \
  -H 'Authorization: Bearer <accessToken>'
```

Текущий талон оператора:

```bash
curl http://10.11.13.50:3000/api/tickets/query/operator/current \
  -H 'Authorization: Bearer <operatorAccessToken>' \
  -H 'X-Department-Id: 00000000-0000-0000-0000-000000000301' \
  -H 'X-Window-Id: 00000000-0000-0000-0000-000000000601'
```

Поиск по номеру:

```bash
curl 'http://10.11.13.50:3000/api/tickets/query/by-number?departmentId=00000000-0000-0000-0000-000000000301&ticketNumber=0023&date=2026-05-11' \
  -H 'Authorization: Bearer <accessToken>'
```

История:

```bash
curl http://10.11.13.50:3000/api/tickets/query/<ticketId>/history \
  -H 'Authorization: Bearer <accessToken>'
```

Печатный талон по номеру:

```bash
curl 'http://10.11.13.50:3000/api/tickets/print?departmentId=00000000-0000-0000-0000-000000000301&ticketNumber=0023&date=2026-05-11' \
  -H 'Authorization: Bearer <accessToken>'
```

Печатный талон по id:

```bash
curl http://10.11.13.50:3000/api/tickets/<ticketId>/print \
  -H 'Authorization: Bearer <accessToken>'
```

## 18. Analytics, reports, audit

Нужна роль:

```text
AUDITOR | MANAGER | ADMIN | SUPER_ADMIN
```

Analytics summary:

```bash
curl 'http://10.11.13.50:3000/api/analytics/summary?departmentId=00000000-0000-0000-0000-000000000301&from=2026-05-01&to=2026-05-11' \
  -H 'Authorization: Bearer <accessToken>'
```

Department load:

```bash
curl 'http://10.11.13.50:3000/api/analytics/department-load?departmentId=00000000-0000-0000-0000-000000000301&from=2026-05-01&to=2026-05-11' \
  -H 'Authorization: Bearer <accessToken>'
```

Operator stats:

```bash
curl 'http://10.11.13.50:3000/api/analytics/operator-stats?departmentId=00000000-0000-0000-0000-000000000301&from=2026-05-01&to=2026-05-11' \
  -H 'Authorization: Bearer <accessToken>'
```

Перерасчет:

```bash
curl -X POST 'http://10.11.13.50:3000/api/analytics/recalculate?departmentId=00000000-0000-0000-0000-000000000301&date=2026-05-11' \
  -H 'Authorization: Bearer <accessToken>'
```

Скачать XLSX отчет:

```bash
curl -L 'http://10.11.13.50:3000/api/reports/department-load.xlsx?departmentId=00000000-0000-0000-0000-000000000301&from=2026-05-01&to=2026-05-11' \
  -H 'Authorization: Bearer <accessToken>' \
  -o department-load.xlsx
```

Core audit по отделу:

```bash
curl 'http://10.11.13.50:3000/api/audit/logs?departmentId=00000000-0000-0000-0000-000000000301&limit=100' \
  -H 'Authorization: Bearer <accessToken>'
```

Core audit по actor:

```bash
curl 'http://10.11.13.50:3000/api/audit/logs/by-actor?actorId=<actorId>&limit=100' \
  -H 'Authorization: Bearer <accessToken>'
```

## 19. Users через Common Auth

Эти routes не идут в Spring, они проксируются в Common Auth.

Нужен bearer token с правами админа в Common Auth.

Список пользователей:

```bash
curl http://10.11.13.50:3000/api/admin/users \
  -H 'Authorization: Bearer <adminAccessToken>'
```

Создать пользователя:

```bash
curl -X POST http://10.11.13.50:3000/api/admin/users \
  -H 'Authorization: Bearer <adminAccessToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "operator@example.com",
    "password": "StrongPassword_123!",
    "fullName": "Queue Operator",
    "role": "OPERATOR",
    "scopes": ["queue:read"]
  }'
```

Обновить:

```bash
curl -X PATCH http://10.11.13.50:3000/api/admin/users/<userId> \
  -H 'Authorization: Bearer <adminAccessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"New Name"}'
```

Изменить роль:

```bash
curl -X PATCH http://10.11.13.50:3000/api/admin/users/<userId>/role \
  -H 'Authorization: Bearer <adminAccessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"role":"ADMIN"}'
```

Удалить:

```bash
curl -X DELETE http://10.11.13.50:3000/api/admin/users/<userId> \
  -H 'Authorization: Bearer <adminAccessToken>'
```

## 20. Maintenance

Нужна роль:

```text
ADMIN | SUPER_ADMIN
```

Запуск maintenance jobs:

```bash
curl -X POST http://10.11.13.50:3000/api/maintenance/run \
  -H 'Authorization: Bearer <adminAccessToken>'
```

## 21. Legacy local endpoints

В проекте остаются старые in-memory endpoints:

```text
/branches
/departments
/services
/department-services
/bookings
/qr/{token}
```

Их использовать только для локальных демо или старого QR booking flow.

Для реальной очереди источник истины - Spring core через gateway routes:

```text
/admin/**
/management/**
/public/bookings/**
/terminal/**
/operator/**
/tv/**
/tickets/**
/analytics/**
/reports/**
```

## 22. Как подключить frontend

Frontend env:

```env
VITE_API_BASE_URL=http://10.11.13.50:3000/api
```

Минимальный API client:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');
  headers.set('Accept-Language', 'ru');
  headers.set('X-Request-Id', crypto.randomUUID());

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw body;
  }

  return body;
}
```

Для operator requests добавить:

```ts
headers.set('X-Department-Id', selectedDepartmentId);
headers.set('X-Window-Id', selectedWindowId);
```

Для XLSX отчетов использовать отдельный download helper и `blob()`, не `json()`.

## 23. Типовые ошибки и что делать

### CORS

Признаки:

- браузер пишет `CORS policy`;
- request в Network может быть blocked;
- нет нормального JSON ответа от backend.

Сейчас Nest открыт:

```text
Access-Control-Allow-Origin: *
Authorization разрешен
X-Request-Id разрешен
X-Department-Id разрешен
X-Window-Id разрешен
```

Если видишь обычный JSON response с `401`, `403`, `503`, это не CORS.

### 401 Unauthorized

Причины:

- нет `Authorization`;
- токен истек;
- Common Auth отверг токен;
- frontend использует старый token после logout.

Что делать:

```bash
curl http://10.11.13.50:3000/api/auth/me \
  -H 'Authorization: Bearer <accessToken>'
```

Если `401`, перелогиниться.

### 403 Forbidden

Причины:

- роль пользователя не подходит;
- пользователь не `ADMIN`, но ходит в `/admin/**`;
- пользователь не `OPERATOR`, но ходит в `/operator/**`.

Что делать:

- проверить `/api/auth/me`;
- проверить `roles`;
- назначить правильную роль в Common Auth.

### 503 Auth service is unavailable

Причины:

- `AUTH_SERVICE_BASE_URL` неправильный;
- контейнер не получил `.env`;
- Common Auth недоступен из сети сервера.

Проверка:

```bash
docker compose exec app printenv AUTH_SERVICE_BASE_URL
curl -i https://auth-api.tsvs.kg/auth/me -H 'Authorization: Bearer fake'
docker compose logs -f app
```

### 503 Spring core is unavailable

Причины:

- `EQUEUE_CORE_URL` неправильный;
- Spring не запущен;
- firewall/network;
- timeout.

Проверка:

```bash
docker compose exec app printenv EQUEUE_CORE_URL
curl http://10.11.13.50:18080/api/actuator/health
```

### 401 от Spring: неверный внутренний токен

Причина:

```text
EQUEUE_CORE_INTERNAL_TOKEN не совпадает с APP_INTERNAL_TOKEN Spring
```

Что делать:

- взять правильный `APP_INTERNAL_TOKEN` из Spring deployment;
- вставить в `.env`;
- пересоздать app container.

```bash
docker compose up -d --build --force-recreate app
```

### 400 Validation error

Причины:

- не хватает обязательного поля;
- неверный формат даты;
- неверный UUID;
- body не совпадает со Spring DTO.

Что делать:

- открыть Spring Swagger;
- сверить request body;
- проверить `Accept-Language`, чтобы ошибки были на нужном языке.

## 24. Полезные seed ids

Для dev/smoke Spring core часто использует:

```text
Department: 00000000-0000-0000-0000-000000000301
Category TS: 00000000-0000-0000-0000-000000000101
Category VS: 00000000-0000-0000-0000-000000000102
Service TS registration: 00000000-0000-0000-0000-000000000401
Window 1: 00000000-0000-0000-0000-000000000601
Operator: 00000000-0000-0000-0000-000000000701
Terminal: TERM-BIRIMDIK-001
TV: TV-BIRIMDIK-001
```

## 25. Обновление после изменений

Если менялся код:

```bash
npm run build
npm test -- --runInBand
docker compose up -d --build --force-recreate app
```

Если менялся только `.env`:

```bash
docker compose up -d --force-recreate app
```

Проверить:

```bash
curl http://10.11.13.50:3000/api/health
docker compose logs --tail=100 app
```

## 26. Минимальный порядок запуска всей системы

1. Убедиться, что Spring core жив:

```bash
curl http://10.11.13.50:18080/api/actuator/health
```

2. Убедиться, что Common Auth жив:

```bash
curl -i https://auth-api.tsvs.kg/auth/me -H 'Authorization: Bearer fake-token'
```

3. Заполнить `.env` для Nest.

4. Запустить Nest:

```bash
docker compose up -d --build
```

5. Проверить Nest:

```bash
curl http://10.11.13.50:3000/api/health
```

6. Залогиниться через `/api/auth/login`.

7. Проверить `/api/auth/me`.

8. Проверить admin route:

```bash
curl http://10.11.13.50:3000/api/admin/branches \
  -H 'Authorization: Bearer <adminAccessToken>'
```

9. Настроить frontend:

```env
VITE_API_BASE_URL=http://10.11.13.50:3000/api
```

10. Работать через frontend или curl только с Nest gateway.
