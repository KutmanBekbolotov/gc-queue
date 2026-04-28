import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_REQUEST_USER_KEY, AUTH_ROLES } from '../auth.constants';
import { AuthRequestUser } from '../auth.interfaces';
import { normalizeRoleCode } from '../auth.utils';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(AUTH_ROLES, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Record<string, AuthRequestUser>>();
    const user = request[AUTH_REQUEST_USER_KEY];

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const normalizedUserRoles = user.roles.map(normalizeRoleCode);
    const hasRequiredRole = requiredRoles
      .map(normalizeRoleCode)
      .some((role) => normalizedUserRoles.includes(role));

    if (!hasRequiredRole) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
