import { SetMetadata } from '@nestjs/common';
import { AUTH_PUBLIC_ROUTE } from '../auth.constants';

export const Public = () => SetMetadata(AUTH_PUBLIC_ROUTE, true);
