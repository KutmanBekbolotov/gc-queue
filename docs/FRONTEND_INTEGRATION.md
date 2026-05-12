# Инструкция для интеграции фронтенда с GC Queue API

Документ описывает, как фронтенду работать с текущим NestJS API gateway. Основной контракт для новых экранов идет через gateway к Spring Queue Core. Локальные in-memory эндпоинты оставлены в проекте для ранних CRUD/booking сценариев и QR booking flow, их нужно использовать осторожно и не смешивать с core-контрактом без явного решения команды.

## 1. Базовая настройка

### Base URL

По умолчанию backend слушает:

```text
http://localhost:3000
```

Если на backend задан `API_PREFIX`, все бизнес-роуты становятся доступными под этим префиксом:

```text
http://localhost:3000/{API_PREFIX}/...
```

Swagger UI:

```text
GET /docs
```

Swagger JSON:

```text
GET /docs-json
```

OpenAPI можно экспортировать из backend-репозитория:

```bash
npm run swagger:export
```

### Форматы

Все JSON-запросы отправлять с заголовками:

```http
Accept: application/json
Content-Type: application/json
```

Для SVG QR-кодов backend возвращает:

```http
Content-Type: image/svg+xml
Cache-Control: no-store
```

Даты:

- дата слота: `YYYY-MM-DD`, например `2026-05-01`;
- время слота в public booking: `HH:mm:ss`, например `09:00:00`;
- ISO datetime в legacy booking: `2026-03-24T09:00:00.000Z`.

Идентификаторы:

- Spring core gateway обычно использует UUID/string id;
- legacy in-memory endpoints используют numeric id.

### CORS

CORS включен на backend через `app.enableCors()`. Фронт может ходить напрямую к NestJS gateway из браузера.

## 2. Важное правило интеграции

Фронтенд должен ходить в NestJS gateway, а не напрямую в Spring Core и не напрямую в Common Auth, если для сценария есть локальный endpoint.

Нельзя передавать или хранить на фронте:

```text
EQUEUE_CORE_INTERNAL_TOKEN
```

NestJS сам добавляет внутренние заголовки для Spring core:

- `X-Internal-Token`;
- `X-Actor-Id`;
- `X-Actor-Role`;
- `X-Department-Id`;
- `X-Window-Id`;
- `X-Request-Id`;
- `Accept-Language`.

Фронт может и должен передавать только публичные/пользовательские заголовки:

```http
Authorization: Bearer <accessToken>
Accept-Language: ru | ky
X-Request-Id: <uuid>
X-Department-Id: <departmentId>
X-Window-Id: <windowId>
```

`X-Department-Id` и `X-Window-Id` нужны в кабинетах оператора/менеджера, когда backend должен прокинуть контекст пользователя в Spring core.

## 3. Авторизация

### Login

```http
POST /auth/login
```

Body:

```json
{
  "email": "operator@example.com",
  "password": "StrongPassword_123!"
}
```

Ответ проксируется из Common Auth. Ожидаемый формат зависит от Common Auth, в тестах используется:

```json
{
  "accessToken": "access-token",
  "tokenType": "Bearer"
}
```

После login фронт сохраняет access token и добавляет его во все защищенные запросы:

```http
Authorization: Bearer access-token
```

### Текущий пользователь

```http
GET /auth/me
Authorization: Bearer <accessToken>
```

Нормализованный ответ:

```ts
type AuthContext = {
  id?: string;
  email?: string;
  username?: string;
  fullName?: string;
  ordId?: string;
  departmentId?: string;
  role?: string;
  roles?: string[];
  scopes?: string[];
};
```

### Logout

```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

### Роли

Backend проверяет роли через `@Roles()`.

| Роль | Основные экраны |
| --- | --- |
| `OPERATOR` | операторский dashboard, вызов талонов, действия по талону |
| `MANAGER` | dashboard отдела, management endpoints |
| `ADMIN` | management, admin справочники, пользователи |
| `SUPER_ADMIN` | admin справочники, management |
| `AUDITOR` | роль поддержана actor model, но отдельные endpoints сейчас не выделены |

Если токена нет, backend вернет `401`. Если роли недостаточно, backend вернет `403`.

## 4. Рекомендуемый frontend API client

Пример на `fetch`:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

type ApiOptions = {
  token?: string;
  departmentId?: string;
  windowId?: string;
  language?: 'ru' | 'ky';
  requestId?: string;
};

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: ApiOptions = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('Accept-Language', options.language ?? 'ru');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  if (options.departmentId) {
    headers.set('X-Department-Id', options.departmentId);
  }

  if (options.windowId) {
    headers.set('X-Window-Id', options.windowId);
  }

  if (options.requestId) {
    headers.set('X-Request-Id', options.requestId);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw payload;
  }

  return payload as T;
}
```

POST/PATCH helper:

```ts
export function jsonBody(value: unknown): RequestInit {
  return {
    body: JSON.stringify(value),
  };
}
```

## 5. Ошибки

### Ошибки Nest validation

При неправильном body/query backend обычно вернет:

```json
{
  "message": ["field must be a string"],
  "error": "Bad Request",
  "statusCode": 400
}
```

Фронт должен уметь показывать массив `message` как список ошибок формы.

### Ошибки Spring core proxy

Если Spring core вернул ошибку, Nest нормализует ее:

```json
{
  "status": 400,
  "code": "CORE_HTTP_ERROR",
  "message": "Spring core rejected the request",
  "errors": {},
  "requestId": "..."
}
```

Для поддержки обращений в саппорт показывать пользователю короткое сообщение, а `requestId` писать в логи/diagnostics.

### Auth/core unavailable

Возможные gateway ошибки:

- `503 Auth service is unavailable`;
- `504 Auth service request timed out`;
- `503 Spring core is unavailable`;
- `504 Spring core request timed out`.

Фронт должен показывать состояние "сервис временно недоступен" и давать повторить запрос.

## 6. Основные сценарии интеграции

### 6.1. Public web booking

Назначение: гражданин выбирает услугу, слот и создает запись.

1. Получить список услуг отдела:

```http
GET /catalog/department-services?departmentId=<departmentId>
Accept-Language: ru
```

2. Получить доступные слоты:

```http
GET /public/bookings/slots?departmentId=<departmentId>&serviceId=<serviceId>&date=2026-05-01
```

3. Создать запись:

```http
POST /public/bookings
Content-Type: application/json
```

```json
{
  "departmentId": "00000000-0000-0000-0000-000000000301",
  "categoryId": "00000000-0000-0000-0000-000000000101",
  "serviceId": "00000000-0000-0000-0000-000000000401",
  "bookingDate": "2026-05-01",
  "bookingTime": "09:00:00",
  "citizenFullName": "Иванов Иван"
}
```

4. Получить запись по коду подтверждения:

```http
GET /public/bookings/{confirmationCode}
```

5. Подтвердить запись:

```http
POST /public/bookings/{confirmationCode}/confirm
```

6. Check-in по записи:

```http
POST /public/bookings/{confirmationCode}/check-in
```

7. Отменить запись:

```http
POST /public/bookings/{confirmationCode}/cancel
```

Body свободный, проксируется в Spring core:

```json
{
  "reason": "Не смогу прийти"
}
```

### 6.2. Terminal

Назначение: терминал в отделении создает талоны и QR-сессии.

1. Экран терминала знает свой `deviceCode`.

2. Создать талон:

```http
POST /terminal/{deviceCode}/tickets
```

```json
{
  "departmentId": "00000000-0000-0000-0000-000000000301",
  "categoryId": "00000000-0000-0000-0000-000000000101",
  "serviceId": "00000000-0000-0000-0000-000000000401",
  "citizenFullName": "Иванов Иван"
}
```

3. Создать QR-сессию для mobile handoff:

```http
POST /terminal/{deviceCode}/qr-sessions
```

Body свободный, передается в Spring core.

4. Получить шаблон печати талона:

```http
GET /terminal/{deviceCode}/tickets/{ticketId}/print
```

### 6.3. QR session flow через Spring core

1. Проверить QR session token:

```http
GET /qr/sessions/validate?token=<token>
```

2. Создать талон из QR session:

```http
POST /qr/tickets
```

Body свободный, передается в Spring core.

Текущий код задает `200 OK` для `POST /qr/tickets`.

### 6.4. TV display

Назначение: табло показывает snapshot очереди.

Вариант по department:

```http
GET /tv/snapshot?departmentId=<departmentId>
Accept-Language: ru
```

Вариант по устройству:

```http
GET /tv/{deviceCode}/snapshot
Accept-Language: ru
```

Backend кэширует TV snapshot на короткое время через `EQUEUE_TV_CACHE_TTL_MS`, по умолчанию `2000 ms`. Фронт может polling-ить snapshot, например каждые 2-5 секунд, без хранения внутреннего core token.

### 6.5. Operator workplace

Все endpoints требуют:

```http
Authorization: Bearer <accessToken>
X-Department-Id: <departmentId>
X-Window-Id: <windowId>
```

Пользователь должен иметь роль `OPERATOR`.

1. Получить dashboard:

```http
GET /operator/dashboard
```

2. Пометить окно доступным:

```http
POST /operator/window/available
```

Body свободный, передается в Spring core. Обычно туда кладут выбранное окно/отдел, если Spring contract это требует.

3. Взять следующий талон:

```http
POST /operator/tickets/next
```

Body свободный, передается в Spring core.

4. Выполнить действие по талону:

```http
POST /operator/tickets/{ticketId}/{action}
```

Допустимые `action`:

- `recall`;
- `start`;
- `complete`;
- `no-show`;
- `reject`;
- `restore`.

Body свободный, например причина отказа/no-show, если ее требует Spring core.

5. Получить талоны, которые можно восстановить:

```http
GET /operator/tickets/restorable
```

Query параметры проксируются в Spring core.

6. Пометить окно как away:

```http
POST /operator/window/away
```

### 6.6. Manager dashboard

Требуется роль `MANAGER`, `ADMIN` или `SUPER_ADMIN`.

```http
GET /dashboard/department?departmentId=<departmentId>
Authorization: Bearer <accessToken>
```

Query параметры проксируются в Spring core.

Admin dashboard:

```http
GET /dashboard/admin
Authorization: Bearer <accessToken>
```

Требуется роль `ADMIN` или `SUPER_ADMIN`.

### 6.7. Analytics, reports, audit и поиск талонов

Эти endpoints проксируют Spring core и требуют bearer token.

Analytics и reports доступны ролям `AUDITOR`, `MANAGER`, `ADMIN`, `SUPER_ADMIN`:

```http
GET /analytics/department-load?departmentId=<departmentId>&from=2026-05-01&to=2026-05-11
GET /analytics/operator-stats?departmentId=<departmentId>&from=2026-05-01&to=2026-05-11
GET /analytics/summary?departmentId=<departmentId>&from=2026-05-01&to=2026-05-11
POST /analytics/recalculate?departmentId=<departmentId>&date=2026-05-11
GET /reports/department-load.xlsx?departmentId=<departmentId>&from=2026-05-01&to=2026-05-11
```

`/reports/department-load.xlsx` возвращает бинарный XLSX. Для скачивания не парсить ответ как JSON.

Core audit:

```http
GET /audit/logs?departmentId=<departmentId>&limit=100
GET /audit/logs/by-actor?actorId=<actorId>&limit=100
```

Поиск и печать талонов:

```http
POST /tickets
GET /tickets/query/waiting?departmentId=<departmentId>&serviceId=<serviceId>&limit=20
GET /tickets/query/operator/current
GET /tickets/query/by-number?departmentId=<departmentId>&ticketNumber=0023&date=2026-05-11
GET /tickets/query/{ticketId}/history
GET /tickets/print?departmentId=<departmentId>&ticketNumber=0023&date=2026-05-11
GET /tickets/{ticketId}/print
```

Maintenance:

```http
POST /maintenance/run
```

Требуется роль `ADMIN` или `SUPER_ADMIN`.

### 6.8. Admin справочники Spring core

Требуется роль `ADMIN` или `SUPER_ADMIN`.

Поддержанные resources:

- `branches`;
- `departments`;
- `categories`;
- `services`.

Коллекция:

```http
GET|POST|PATCH|PUT|DELETE /admin/{resource}
```

Элемент:

```http
GET|POST|PATCH|PUT|DELETE /admin/{resource}/{id}
```

Назначение услуги отделу:

```http
GET|POST|PATCH|PUT|DELETE /admin/departments/{departmentId}/services/{serviceId}
```

Все query/body проксируются в Spring core как есть. Перед отправкой фронт должен свериться с контрактом Spring core или Swagger JSON текущего gateway.

### 6.9. Department management

Требуется роль `MANAGER`, `ADMIN` или `SUPER_ADMIN`.

Поддержанные resources:

- `employees`;
- `halls`;
- `windows`;
- `terminals`;
- `tv-devices`;
- `work-schedules`;
- `reject-reasons`;
- `no-show-reasons`.

Коллекция:

```http
GET|POST|PATCH|PUT|DELETE /management/departments/{departmentId}/{resource}
```

Элемент:

```http
GET|POST|PATCH|PUT|DELETE /management/departments/{departmentId}/{resource}/{id}
```

Nest переводит item route в реальные Spring paths вида `/internal/management/{resource}/{id}`. Для `work-schedules` item route не используется: Spring принимает `GET`/`PUT` только на collection path `/internal/management/departments/{departmentId}/work-schedules`.

Дополнительные assignment endpoints:

```http
POST|DELETE /management/employees/{employeeId}/services/{serviceId}
POST|DELETE /management/employees/{employeeId}/windows/{windowId}
```

Body/query проксируются в Spring core.

### 6.10. Admin users через Common Auth

Все endpoints требуют bearer token. Nest проксирует запросы в Common Auth, нормализует роли в CAPS и мапит legacy `fullName` в `username`.

Список пользователей:

```http
GET /admin/users
```

Создать пользователя:

```http
POST /admin/users
```

```json
{
  "email": "operator@example.com",
  "password": "StrongPassword_123!",
  "username": "operator",
  "role": "OPERATOR"
}
```

Если админ создает заведующего отделением (`MANAGER`), нужно передать привязку:

```json
{
  "email": "manager@example.com",
  "password": "StrongPassword_123!",
  "username": "manager",
  "role": "MANAGER",
  "ordId": "00000000-0000-0000-0000-000000000101",
  "departmentId": "00000000-0000-0000-0000-000000000301"
}
```

Если пользователь с ролью `MANAGER` создает пользователей, frontend может не отправлять `ordId` и `departmentId`: Nest автоматически берет их из текущего manager `/auth/me` и подставляет в создаваемого пользователя. Если frontend все-таки отправит другие значения, Nest заменит их значениями текущего manager.

Обновить профиль/scope:

```http
PATCH /admin/users/{id}
```

```json
{
  "email": "operator@example.com",
  "username": "operator",
  "isActive": true,
  "isBlocked": false
}
```

Удалить пользователя:

```http
DELETE /admin/users/{id}
```

Обновить роль:

```http
PATCH /admin/users/{id}/role
```

```json
{
  "role": "ADMIN"
}
```

## 7. Полный список gateway endpoints для новых экранов

| Method | Route | Auth | Назначение |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Login через Common Auth |
| `GET` | `/auth/me` | Bearer | Текущий пользователь |
| `POST` | `/auth/logout` | Bearer | Logout |
| `GET` | `/catalog/department-services` | Public | Каталог услуг отдела из Spring core |
| `GET` | `/public/bookings/slots` | Public | Слоты записи |
| `POST` | `/public/bookings` | Public | Создать public booking |
| `GET` | `/public/bookings/{confirmationCode}` | Public | Получить booking |
| `POST` | `/public/bookings/{confirmationCode}/confirm` | Public | Подтвердить booking |
| `POST` | `/public/bookings/{confirmationCode}/check-in` | Public | Check-in booking |
| `POST` | `/public/bookings/{confirmationCode}/cancel` | Public | Отменить booking |
| `POST` | `/terminal/{deviceCode}/tickets` | Public | Создать талон с терминала |
| `POST` | `/terminal/{deviceCode}/qr-sessions` | Public | Создать QR session |
| `GET` | `/terminal/{deviceCode}/tickets/{ticketId}/print` | Public | Печать талона |
| `GET` | `/qr/sessions/validate` | Public | Проверить QR session |
| `POST` | `/qr/tickets` | Public | Создать талон из QR session |
| `GET` | `/tv/snapshot` | Public | TV snapshot по отделу |
| `GET` | `/tv/{deviceCode}/snapshot` | Public | TV snapshot по устройству |
| `GET` | `/operator/dashboard` | `OPERATOR` | Dashboard оператора |
| `POST` | `/operator/window/available` | `OPERATOR` | Окно доступно |
| `POST` | `/operator/window/away` | `OPERATOR` | Окно недоступно |
| `POST` | `/operator/tickets/next` | `OPERATOR` | Следующий талон |
| `GET` | `/operator/tickets/restorable` | `OPERATOR` | Восстановимые талоны |
| `POST` | `/operator/tickets/{ticketId}/{action}` | `OPERATOR` | Действие по талону |
| `GET` | `/tickets/query/waiting` | `OPERATOR/MANAGER/ADMIN/SUPER_ADMIN` | Ожидающие талоны |
| `GET` | `/tickets/query/operator/current` | `OPERATOR/MANAGER/ADMIN/SUPER_ADMIN` | Текущий талон оператора |
| `GET` | `/tickets/query/by-number` | `OPERATOR/MANAGER/ADMIN/SUPER_ADMIN` | Поиск талона по номеру |
| `GET` | `/tickets/query/{ticketId}/history` | `OPERATOR/MANAGER/ADMIN/SUPER_ADMIN` | История талона |
| `GET` | `/tickets/print` | `OPERATOR/MANAGER/ADMIN/SUPER_ADMIN` | Печатный талон по номеру |
| `GET` | `/tickets/{ticketId}/print` | `OPERATOR/MANAGER/ADMIN/SUPER_ADMIN` | Печатный талон по id |
| `GET` | `/dashboard/department` | `MANAGER/ADMIN/SUPER_ADMIN` | Dashboard отдела |
| `GET` | `/dashboard/admin` | `ADMIN/SUPER_ADMIN` | Admin dashboard |
| `GET` | `/analytics/department-load` | `AUDITOR/MANAGER/ADMIN/SUPER_ADMIN` | Нагрузка отделения |
| `GET` | `/analytics/operator-stats` | `AUDITOR/MANAGER/ADMIN/SUPER_ADMIN` | Статистика операторов |
| `GET` | `/analytics/summary` | `AUDITOR/MANAGER/ADMIN/SUPER_ADMIN` | Сводная аналитика |
| `POST` | `/analytics/recalculate` | `AUDITOR/MANAGER/ADMIN/SUPER_ADMIN` | Перерасчет аналитики |
| `GET` | `/reports/department-load.xlsx` | `AUDITOR/MANAGER/ADMIN/SUPER_ADMIN` | XLSX отчет |
| `GET` | `/audit/logs` | `AUDITOR/MANAGER/ADMIN/SUPER_ADMIN` | Core audit по отделу |
| `GET` | `/audit/logs/by-actor` | `AUDITOR/MANAGER/ADMIN/SUPER_ADMIN` | Core audit по actor |
| `POST` | `/maintenance/run` | `ADMIN/SUPER_ADMIN` | Запуск maintenance |
| `ALL` | `/admin/{resource}` | `ADMIN/SUPER_ADMIN` | Admin collection proxy |
| `ALL` | `/admin/{resource}/{id}` | `ADMIN/SUPER_ADMIN` | Admin item proxy |
| `ALL` | `/admin/departments/{departmentId}/services/{serviceId}` | `ADMIN/SUPER_ADMIN` | Department-service proxy |
| `ALL` | `/management/departments/{departmentId}/{resource}` | `MANAGER/ADMIN/SUPER_ADMIN` | Management collection proxy |
| `ALL` | `/management/departments/{departmentId}/{resource}/{id}` | `MANAGER/ADMIN/SUPER_ADMIN` | Management item proxy |
| `ALL` | `/management/employees/{employeeId}/services/{serviceId}` | `MANAGER/ADMIN/SUPER_ADMIN` | Employee-service assignment proxy |
| `ALL` | `/management/employees/{employeeId}/windows/{windowId}` | `MANAGER/ADMIN/SUPER_ADMIN` | Employee-window assignment proxy |
| `GET` | `/admin/users` | Bearer | Список пользователей |
| `POST` | `/admin/users` | Bearer | Создать пользователя |
| `PATCH` | `/admin/users/{id}` | Bearer | Обновить пользователя |
| `DELETE` | `/admin/users/{id}` | Bearer | Удалить пользователя |
| `PATCH` | `/admin/users/{id}/role` | Bearer | Обновить роль |
| `GET` | `/health` | Public | Health check |

## 8. DTO для gateway endpoints

```ts
type DepartmentServicesQuery = {
  departmentId: string;
};

type PublicBookingSlotsQuery = {
  departmentId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
};

type CreatePublicBooking = {
  departmentId: string;
  categoryId: string;
  serviceId: string;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:mm:ss
  citizenFullName: string;
};

type CreateTerminalTicket = {
  departmentId: string;
  categoryId: string;
  serviceId: string;
  citizenFullName?: string;
};

type LoginBody = {
  email: string;
  password: string;
};

type CreateUserBody = {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
  role?: string;
  ordId?: string;
  departmentId?: string;
  scopes?: string[];
};

type UpdateUserBody = {
  email?: string;
  username?: string;
  fullName?: string;
  isActive?: boolean;
  isBlocked?: boolean;
  ordId?: string;
  departmentId?: string;
  scopes?: string[];
};

type UpdateUserRoleBody = {
  role: string;
};
```

Для proxy endpoints (`/admin/**`, `/management/**`, `/operator/**` body части, `/tickets`, `/terminal/{deviceCode}/qr-sessions`, `/qr/tickets`) backend сейчас принимает `Record<string, unknown>` и передает тело дальше в Spring core. Фронтенд должен брать точную форму body из Spring core contract или актуального Swagger JSON после синхронизации.

## 9. Legacy local endpoints

Эти endpoints работают поверх in-memory сервисов NestJS. Они полезны для раннего UI, локальных демо и QR booking flow, но Spring core остается источником истины для новых queue сценариев.

### Branches

| Method | Route | Auth | Body/Query |
| --- | --- | --- | --- |
| `GET` | `/branches` | Public | - |
| `GET` | `/branches/{id}` | Public | - |
| `POST` | `/branches` | Bearer | `CreateBranch` |
| `PATCH` | `/branches/{id}` | Bearer | `Partial<CreateBranch>` |
| `DELETE` | `/branches/{id}` | Bearer | - |

```ts
type Branch = {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CreateBranch = {
  code: string;
  name: string;
  isActive?: boolean;
};
```

### Departments

| Method | Route | Auth | Body/Query |
| --- | --- | --- | --- |
| `GET` | `/departments` | Public | - |
| `GET` | `/departments/{id}` | Public | - |
| `POST` | `/departments` | Bearer | `CreateDepartment` |
| `PATCH` | `/departments/{id}` | Bearer | `Partial<CreateDepartment>` |
| `DELETE` | `/departments/{id}` | Bearer | - |

```ts
type Department = {
  id: number;
  branchId: number;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CreateDepartment = {
  branchId: number;
  code: string;
  name: string;
  isActive: boolean;
};
```

### Services catalog

| Method | Route | Auth | Body/Query |
| --- | --- | --- | --- |
| `GET` | `/services` | Public | - |
| `GET` | `/services/{id}` | Public | - |
| `POST` | `/services` | Bearer | `CreateService` |
| `PATCH` | `/services/{id}` | Bearer | `Partial<CreateService>` |
| `DELETE` | `/services/{id}` | Bearer | - |

```ts
type ServiceNodeType = 'CATEGORY' | 'SERVICE';

type ServiceEntity = {
  id: number;
  code: string;
  name: string;
  description: string;
  type: ServiceNodeType;
  parentId: number | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CreateService = {
  code: string;
  name: string;
  description?: string;
  type?: ServiceNodeType;
  parentId?: number | null;
  isActive?: boolean;
};
```

Ограничения legacy catalog:

- системные root categories `ВС` и `ТС` создаются автоматически;
- новые root nodes запрещены;
- `parentId` обязателен для новых узлов;
- назначать в department можно только `type: 'SERVICE'`.

### Department-services

| Method | Route | Auth | Body/Query |
| --- | --- | --- | --- |
| `POST` | `/department-services/assign` | Bearer | `AssignDepartmentService` |
| `POST` | `/department-services/unassign` | Bearer | `AssignDepartmentService` |
| `GET` | `/department-services/by-department/{departmentId}` | Public | - |
| `GET` | `/department-services/by-department/{departmentId}/services` | Public | `channel?` |
| `GET` | `/department-services/by-service/{serviceId}` | Public | - |
| `GET` | `/department-services/by-service/{serviceId}/departments` | Public | `channel?` |
| `PATCH` | `/department-services/{id}` | Bearer | `UpdateDepartmentService` |
| `DELETE` | `/department-services/{id}` | Bearer | - |

```ts
type DepartmentServiceChannel = 'booking' | 'terminal' | 'operator';

type DepartmentServiceLink = {
  id: number;
  departmentId: number;
  serviceId: number;
  isActive: boolean;
  bookingEnabled: boolean;
  terminalEnabled: boolean;
  operatorEnabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
};

type AssignDepartmentService = {
  departmentId: number;
  serviceId: number;
  isActive?: boolean;
  bookingEnabled?: boolean;
  terminalEnabled?: boolean;
  operatorEnabled?: boolean;
  priority?: number;
};

type UpdateDepartmentService = {
  isActive?: boolean;
  bookingEnabled?: boolean;
  terminalEnabled?: boolean;
  operatorEnabled?: boolean;
  priority?: number;
};
```

`channel` фильтрует доступность услуги:

```text
booking | terminal | operator
```

### Legacy bookings

| Method | Route | Auth | Body/Query |
| --- | --- | --- | --- |
| `GET` | `/bookings/slots` | Public | `branchId`, `departmentId`, `serviceId`, `date` |
| `POST` | `/bookings` | Public | `CreateBooking` |
| `GET` | `/bookings` | Bearer | - |
| `GET` | `/bookings/{id}` | Public | - |
| `GET` | `/bookings/{id}/qr` | Public | - |
| `GET` | `/bookings/{id}/qr.svg` | Public | - |
| `PATCH` | `/bookings/{id}/confirm` | Bearer | - |
| `PATCH` | `/bookings/{id}/cancel` | Bearer | `CancelBooking` |

```ts
type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

type Booking = {
  id: number;
  branchId: number;
  departmentId: number;
  serviceId: number;
  customerName: string;
  customerContact: string;
  scheduledAt: string;
  status: BookingStatus;
  qrToken: string;
  qrExpiresAt: string;
  qrUsedAt?: string;
  cancelReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type CreateBooking = {
  branchId: number;
  departmentId: number;
  serviceId: number;
  customerName: string;
  customerContact: string;
  scheduledAt: string;
  notes?: string;
};

type CancelBooking = {
  reason?: string;
};

type QrPayload = {
  bookingId: number;
  qrToken: string;
  qrExpiresAt: string;
  qrUsedAt?: string;
  isExpired: boolean;
  isUsed: boolean;
};
```

Legacy slots возвращают массив ISO datetime строк. Сейчас генерируются часовые слоты с `09:00` по `16:00` UTC и фильтруются уже занятые/прошедшие.

### Legacy QR token

| Method | Route | Auth | Назначение |
| --- | --- | --- | --- |
| `GET` | `/qr/{token}.svg` | Public | SVG QR по token |
| `GET` | `/qr/{token}` | Public | Проверить token |
| `POST` | `/qr/{token}/consume` | Bearer | Одноразово погасить token |

```ts
type QrInspection = {
  bookingId: number;
  status: BookingStatus;
  scheduledAt: string;
  qrExpiresAt: string;
  qrUsedAt?: string;
  valid: boolean;
};

type QrConsumeResponse = {
  bookingId: number;
  consumedAt: string;
  valid: true;
};
```

### Audit

```http
GET /audit?actorId=&actorType=&action=&entityType=&entityId=&correlationId=
Authorization: Bearer <accessToken>
```

Ответ:

```ts
type AuditLog = {
  id: number;
  actorId?: string;
  actorType: string;
  ip?: string;
  userAgent?: string;
  deviceId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  beforeState?: unknown;
  afterState?: unknown;
  timestamp: string;
  correlationId: string;
};
```

### Health

```http
GET /health
```

```ts
type HealthResponse = {
  status: 'ok';
  service: 'gc-queue-nest';
  timestamp: string;
  uptimeSeconds: number;
};
```

## 10. Хранение состояния на фронте

Минимальное состояние приложения:

```ts
type FrontendSessionState = {
  accessToken?: string;
  user?: AuthContext;
  language: 'ru' | 'ky';
  selectedDepartmentId?: string;
  selectedWindowId?: string;
  deviceCode?: string;
};
```

Рекомендации:

- access token хранить согласно общей security-политике проекта;
- при `401` очищать session state и отправлять на login;
- при `403` показывать экран "нет доступа";
- `selectedDepartmentId` и `selectedWindowId` не подменяют роли, они только задают рабочий контекст;
- каждый пользовательский action логировать на фронте вместе с `X-Request-Id`.

## 11. Интеграционный чеклист для фронтенда

1. Завести `VITE_API_BASE_URL` или аналогичную переменную окружения.
2. Сделать единый API client с Bearer token, `Accept-Language`, `X-Request-Id`.
3. Реализовать login, `/auth/me`, logout и обработку `401/403`.
4. Развести API namespaces:
   - `authApi`;
   - `publicBookingApi`;
   - `terminalApi`;
   - `qrApi`;
   - `tvApi`;
   - `operatorApi`;
   - `managerApi`;
   - `adminApi`;
   - `legacyApi`, если legacy endpoints действительно нужны.
5. Для новых queue экранов использовать Spring core gateway endpoints, а не legacy in-memory CRUD.
6. Для operator экранов передавать `X-Department-Id` и `X-Window-Id`.
7. Для TV/terminal экранов хранить и передавать `deviceCode` в path.
8. Для public booking использовать string UUID id и формат `YYYY-MM-DD`/`HH:mm:ss`.
9. Для legacy booking использовать numeric id и ISO datetime.
10. Для proxy endpoints согласовать body/query с актуальным контрактом Spring core.
11. Подключить Swagger/OpenAPI генерацию типов, если фронт использует TypeScript.
12. Протестировать happy path и ошибки:
    - login success/fail;
    - token expired;
    - роль недостаточна;
    - Spring core unavailable;
    - validation error;
    - public booking create/cancel;
    - terminal ticket create/print;
    - operator next/action;
    - TV snapshot polling.

## 12. Быстрые curl-примеры

Login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"operator@example.com","password":"StrongPassword_123!"}'
```

Current user:

```bash
curl http://localhost:3000/auth/me \
  -H 'Authorization: Bearer access-token'
```

Public booking slots:

```bash
curl 'http://localhost:3000/public/bookings/slots?departmentId=00000000-0000-0000-0000-000000000301&serviceId=00000000-0000-0000-0000-000000000401&date=2026-05-01' \
  -H 'Accept-Language: ru'
```

Create terminal ticket:

```bash
curl -X POST http://localhost:3000/terminal/TERM-001/tickets \
  -H 'Content-Type: application/json' \
  -d '{
    "departmentId": "00000000-0000-0000-0000-000000000301",
    "categoryId": "00000000-0000-0000-0000-000000000101",
    "serviceId": "00000000-0000-0000-0000-000000000401",
    "citizenFullName": "Иванов Иван"
  }'
```

Operator next ticket:

```bash
curl -X POST http://localhost:3000/operator/tickets/next \
  -H 'Authorization: Bearer access-token' \
  -H 'X-Department-Id: 00000000-0000-0000-0000-000000000301' \
  -H 'X-Window-Id: 00000000-0000-0000-0000-000000000501' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

TV snapshot:

```bash
curl 'http://localhost:3000/tv/snapshot?departmentId=00000000-0000-0000-0000-000000000301' \
  -H 'Accept-Language: ru'
```
