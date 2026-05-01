import { Controller, Get, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthRequestUser } from '../auth/auth.interfaces';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CoreActorFactory } from '../core/core-actor.factory';
import { EqueueCoreClient } from '../core/equeue-core.client';

@ApiTags('core manager')
@ApiBearerAuth()
@Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
@Controller('dashboard')
export class ManagerDashboardGatewayController {
  constructor(
    private readonly core: EqueueCoreClient,
    private readonly actors: CoreActorFactory,
  ) {}

  @ApiOperation({ summary: 'Get Spring core department dashboard' })
  @ApiOkResponse({ description: 'Spring core department dashboard response' })
  @Get('department')
  department(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    const departmentId =
      typeof query.departmentId === 'string' ? query.departmentId : undefined;

    return this.core.get(
      '/internal/dashboard/department',
      this.actors.fromUser(user, request, { departmentId }),
      query,
    );
  }
}
