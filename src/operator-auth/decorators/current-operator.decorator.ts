import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OPERATOR_AUTH_REQUEST_USER_KEY } from '../operator-auth.constants';
import { OperatorAuthRequestUser } from '../operator-auth.interfaces';

export const CurrentOperator = createParamDecorator(
  (_data: unknown, context: ExecutionContext): OperatorAuthRequestUser => {
    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    return request[OPERATOR_AUTH_REQUEST_USER_KEY] as OperatorAuthRequestUser;
  },
);
