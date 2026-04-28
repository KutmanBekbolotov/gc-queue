import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AUTH_REQUEST_USER_KEY } from '../auth.constants';
import { AuthRequestUser } from '../auth.interfaces';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthRequestUser => {
    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    return request[AUTH_REQUEST_USER_KEY] as AuthRequestUser;
  },
);
