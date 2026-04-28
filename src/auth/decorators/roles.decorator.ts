import { SetMetadata } from '@nestjs/common';
import { AUTH_ROLES } from '../auth.constants';

export const Roles = (...roles: string[]) => SetMetadata(AUTH_ROLES, roles);
