import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthRequestUser } from '../auth/auth.interfaces';
import { ActorRole, CoreActor, CoreLanguage } from './core.interfaces';

const CORE_ROLES: ActorRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'AUDITOR',
  'MANAGER',
  'OPERATOR',
  'TERMINAL',
  'TV',
  'SYSTEM',
];

interface ActorOverrides {
  actorId?: string;
  role?: ActorRole;
  departmentId?: string;
  windowId?: string;
  language?: CoreLanguage;
}

@Injectable()
export class CoreActorFactory {
  fromUser(
    user: AuthRequestUser,
    request: Request,
    overrides: ActorOverrides = {},
  ): CoreActor {
    const actorId =
      overrides.actorId ??
      this.stringField(user, 'id') ??
      this.stringField(user, 'username') ??
      this.stringField(user, 'email');

    if (!actorId) {
      throw new UnauthorizedException('Authenticated user id is required');
    }

    return {
      actorId,
      role: overrides.role ?? this.resolveUserRole(user),
      departmentId:
        overrides.departmentId ??
        this.header(request, 'x-department-id') ??
        this.stringField(user, 'departmentId'),
      windowId:
        overrides.windowId ??
        this.header(request, 'x-window-id') ??
        this.stringField(user, 'windowId'),
      language: overrides.language ?? this.language(request),
      requestId: this.header(request, 'x-request-id'),
    };
  }

  system(request: Request, overrides: ActorOverrides = {}): CoreActor {
    return {
      actorId: overrides.actorId ?? 'public-web',
      role: overrides.role ?? 'SYSTEM',
      departmentId: overrides.departmentId,
      windowId: overrides.windowId,
      language: overrides.language ?? this.language(request),
      requestId: this.header(request, 'x-request-id'),
    };
  }

  device(
    role: Extract<ActorRole, 'TERMINAL' | 'TV'>,
    deviceCode: string,
    request: Request,
    overrides: ActorOverrides = {},
  ): CoreActor {
    return {
      actorId: overrides.actorId ?? deviceCode,
      role,
      departmentId: overrides.departmentId,
      windowId: overrides.windowId,
      language: overrides.language ?? this.language(request),
      requestId: this.header(request, 'x-request-id'),
    };
  }

  private resolveUserRole(user: AuthRequestUser): ActorRole {
    const candidates = [
      user.role,
      ...(Array.isArray(user.roles) ? user.roles : []),
    ];

    for (const candidate of candidates) {
      const role = this.normalizeRole(candidate);
      if (role) {
        return role;
      }
    }

    throw new ForbiddenException('User role is not allowed for queue core');
  }

  private normalizeRole(value: unknown): ActorRole | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value
      .trim()
      .toUpperCase()
      .replace(/^ROLE_/, '')
      .replace(/[-\s]+/g, '_');

    return CORE_ROLES.includes(normalized as ActorRole)
      ? (normalized as ActorRole)
      : undefined;
  }

  private language(request: Request): CoreLanguage {
    const value = this.header(request, 'accept-language')?.toLowerCase();
    return value?.startsWith('ky') ? 'ky' : 'ru';
  }

  private header(request: Request, name: string): string | undefined {
    const value = request.headers[name];

    if (Array.isArray(value)) {
      return value[0];
    }

    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private stringField(
    user: AuthRequestUser,
    field: string,
  ): string | undefined {
    const value = user[field];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
}
