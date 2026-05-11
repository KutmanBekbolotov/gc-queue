import { BadGatewayException } from '@nestjs/common';
import {
  AuthProxyResponse,
  AuthRequestUser,
  ResolvedAuthModuleOptions,
} from './auth.interfaces';
import { normalizeRoleCode, toCommonAuthRole } from './auth.roles';

export { AuthRoleCode, normalizeRoleCode } from './auth.roles';

export function resolveAuthOptions(
  options: AuthModuleOptionsLike,
): ResolvedAuthModuleOptions {
  const baseUrl = options.baseUrl?.trim().replace(/\/+$/, '');

  if (!baseUrl) {
    throw new Error('AUTH_SERVICE_BASE_URL must be provided');
  }

  return {
    baseUrl,
    timeoutMs:
      typeof options.timeoutMs === 'number' &&
      Number.isFinite(options.timeoutMs) &&
      options.timeoutMs > 0
        ? options.timeoutMs
        : 5_000,
  };
}

export function extractBearerToken(header?: string): string | null {
  if (!header) {
    return null;
  }

  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

export function normalizeAuthContext(payload: unknown): AuthRequestUser {
  const source = unwrapAuthContext(payload);
  const roles = normalizeStringArray(source.roles).map(normalizeRoleCode);
  const role = normalizeOptionalString(source.role);
  const normalizedRole = role ? normalizeRoleCode(role) : undefined;
  const scopes = [
    ...normalizeStringArray(source.scopes),
    ...normalizeScopeString(source.scope),
  ];

  if (normalizedRole && !roles.includes(normalizedRole)) {
    roles.push(normalizedRole);
  }

  return {
    ...source,
    id: normalizeOptionalString(source.id),
    email: normalizeOptionalString(source.email),
    username: normalizeOptionalString(source.username),
    fullName:
      normalizeOptionalString(source.fullName) ??
      normalizeOptionalString(source.name),
    role: normalizedRole,
    roles: uniqueStrings(roles),
    scopes,
  };
}

export function toCommonAuthUserWriteBody(
  body: object,
): Record<string, unknown> {
  const {
    fullName,
    role,
    scopes: _scopes,
    ...rest
  } = body as Record<string, unknown>;
  const result = removeUndefinedValues(rest);

  // Common Auth write DTOs reject `fullName` and `scopes`.
  // The gateway keeps `fullName` as the frontend contract and maps it here.
  if (typeof fullName === 'string') {
    result.name = fullName;
  }

  if (typeof role === 'string') {
    result.role = toCommonAuthRole(role);
  }

  return result;
}

export function normalizeAuthUserManagementResponse(
  response: AuthProxyResponse,
): AuthProxyResponse {
  return normalizeAuthUserManagementValue(response) as AuthProxyResponse;
}

function unwrapAuthContext(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload)) {
    throw new BadGatewayException(
      'Auth service returned an invalid user context',
    );
  }

  if (isRecord(payload.user)) {
    return {
      ...payload,
      ...payload.user,
    };
  }

  return payload;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeScopeString(value: unknown): string[] {
  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function removeUndefinedValues(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  );
}

function normalizeAuthUserManagementValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeAuthUserManagementValue);
  }

  if (!isRecord(value)) {
    return value;
  }

  const result = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      normalizeAuthUserManagementValue(item),
    ]),
  );

  if (typeof result.name === 'string' && result.fullName === undefined) {
    result.fullName = result.name;
  }

  if (typeof result.role === 'string') {
    result.role = normalizeRoleCode(result.role);
  }

  if (
    Array.isArray(result.roles) &&
    result.roles.every((item) => typeof item === 'string')
  ) {
    result.roles = result.roles.map(normalizeRoleCode);
  }

  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface AuthModuleOptionsLike {
  baseUrl: string;
  timeoutMs?: number;
}
