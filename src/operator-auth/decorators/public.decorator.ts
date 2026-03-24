import { SetMetadata } from '@nestjs/common';
import { OPERATOR_AUTH_PUBLIC_ROUTE } from '../operator-auth.constants';

export const Public = () => SetMetadata(OPERATOR_AUTH_PUBLIC_ROUTE, true);
