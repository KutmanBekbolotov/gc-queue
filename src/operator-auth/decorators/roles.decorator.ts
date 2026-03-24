import { SetMetadata } from '@nestjs/common';
import { OPERATOR_AUTH_ROLES } from '../operator-auth.constants';

export const Roles = (...roles: string[]) =>
  SetMetadata(OPERATOR_AUTH_ROLES, roles);
