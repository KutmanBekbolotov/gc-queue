import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  OPERATOR_AUTH_PUBLIC_ROUTE,
  OPERATOR_AUTH_REQUEST_USER_KEY,
} from '../operator-auth.constants';
import { OperatorAuthService } from '../operator-auth.service';

@Injectable()
export class OperatorAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly operatorAuthService: OperatorAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      OPERATOR_AUTH_PUBLIC_ROUTE,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const user = await this.operatorAuthService.validateAccessToken(token);
    (request as unknown as Record<string, unknown>)[
      OPERATOR_AUTH_REQUEST_USER_KEY
    ] = user;

    return true;
  }

  private extractBearerToken(header?: string): string | null {
    if (!header) {
      return null;
    }

    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
