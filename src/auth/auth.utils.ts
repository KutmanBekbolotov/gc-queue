import { BadGatewayException } from '@nestjs/common';
import { AuthRequestUser, ResolvedAuthModuleOptions } from './auth.interfaces';

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

export function normalizeRoleCode(role: string): string {
  return role.trim().toUpperCase();
}

export function normalizeAuthContext(payload: unknown): AuthRequestUser {
  const source = unwrapAuthContext(payload);
  const roles = normalizeStringArray(source.roles);
  const role = normalizeOptionalString(source.role);
  const scopes = [
    ...normalizeStringArray(source.scopes),
    ...normalizeScopeString(source.scope),
  ];

  if (role && !roles.includes(role)) {
    roles.push(role);
  }

  return {
    ...source,
    id: normalizeOptionalString(source.id),
    email: normalizeOptionalString(source.email),
    username: normalizeOptionalString(source.username),
    fullName:
      normalizeOptionalString(source.fullName) ??
      normalizeOptionalString(source.name),
    role,
    roles,
    scopes,
  };
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface AuthModuleOptionsLike {
  baseUrl: string;
  timeoutMs?: number;
}
