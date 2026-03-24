import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  OPERATOR_AUTH_REQUEST_USER_KEY,
  OPERATOR_AUTH_ROLES,
} from '../operator-auth.constants';
import { OperatorAuthRequestUser } from '../operator-auth.interfaces';
import { normalizeRoleCode } from '../operator-auth.utils';

@Injectable()
export class OperatorRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(OPERATOR_AUTH_ROLES, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Record<string, OperatorAuthRequestUser>>();
    const user = request[OPERATOR_AUTH_REQUEST_USER_KEY];
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
