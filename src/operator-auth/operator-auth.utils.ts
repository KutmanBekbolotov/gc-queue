import { UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import {
  OperatorAuthDuration,
  OperatorAuthModuleOptions,
  ResolvedOperatorAuthModuleOptions,
} from './operator-auth.interfaces';

const DURATION_PATTERN = /^(\d+)(ms|s|m|h|d)$/;

export function resolveOperatorAuthOptions(
  options: OperatorAuthModuleOptions,
): ResolvedOperatorAuthModuleOptions {
  assertSecret('JWT access secret', options.accessTokenSecret);
  assertSecret('JWT refresh secret', options.refreshTokenSecret);

  const accessTokenTtl = options.accessTokenTtl ?? '15m';
  const refreshTokenTtl = options.refreshTokenTtl ?? '7d';

  return {
    ...options,
    accessTokenTtl,
    refreshTokenTtl,
    accessTokenTtlMs: durationToMs(accessTokenTtl),
    refreshTokenTtlMs: durationToMs(refreshTokenTtl),
    allowedRoleCodes: (options.allowedRoleCodes ?? ['OPERATOR']).map(
      normalizeRoleCode,
    ),
    loginRateLimit: {
      maxAttempts: options.loginRateLimit?.maxAttempts ?? 5,
      windowMs: options.loginRateLimit?.windowMs ?? 15 * 60 * 1000,
      blockDurationMs:
        options.loginRateLimit?.blockDurationMs ?? 15 * 60 * 1000,
    },
    seedUsers: options.seedUsers ?? [],
  };
}

export function durationToMs(duration: OperatorAuthDuration): number {
  if (typeof duration === 'number') {
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error('Auth duration must be a positive finite number');
    }
    return duration * 1000;
  }

  const match = DURATION_PATTERN.exec(duration);
  if (!match) {
    throw new Error(
      `Unsupported auth duration "${duration}". Use number (seconds) or strings like 15m, 1h, 7d.`,
    );
  }

  const value = Number(match[1]);
  const unit = match[2];
  const unitMs =
    unit === 'ms'
      ? 1
      : unit === 's'
        ? 1000
        : unit === 'm'
          ? 60 * 1000
          : unit === 'h'
            ? 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;

  return value * unitMs;
}

export function toJwtExpiresIn(
  duration: OperatorAuthDuration,
): number | `${number}${'ms' | 's' | 'm' | 'h' | 'd'}` {
  if (typeof duration === 'number') {
    return duration;
  }

  const match = DURATION_PATTERN.exec(duration);
  if (!match) {
    throw new Error(
      `Unsupported auth duration "${duration}". Use number (seconds) or strings like 15m, 1h, 7d.`,
    );
  }

  return duration as `${number}${'ms' | 's' | 'm' | 'h' | 'd'}`;
}

export function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function normalizeRoleCode(role: string): string {
  return role.trim().toUpperCase();
}

export function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

export function unauthorized(): never {
  throw new UnauthorizedException('Invalid credentials');
}

function assertSecret(name: string, secret: string) {
  if (!secret || secret.trim().length < 32) {
    throw new Error(`${name} must be at least 32 characters long`);
  }
}
