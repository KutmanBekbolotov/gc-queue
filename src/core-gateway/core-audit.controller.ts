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

@ApiTags('core audit')
@ApiBearerAuth()
@Roles('AUDITOR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
@Controller('audit')
export class CoreAuditGatewayController {
  constructor(
    private readonly core: EqueueCoreClient,
    private readonly actors: CoreActorFactory,
  ) {}

  @ApiOperation({ summary: 'List Spring core audit logs by department' })
  @ApiOkResponse({ description: 'Spring core audit logs response' })
  @Get('logs')
  logs(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.core.get(
      '/internal/audit/logs',
      this.actors.fromUser(user, request, {
        departmentId: this.departmentId(query),
      }),
      query,
    );
  }

  @ApiOperation({ summary: 'List Spring core audit logs by actor' })
  @ApiOkResponse({ description: 'Spring core audit logs by actor response' })
  @Get('logs/by-actor')
  logsByActor(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.core.get(
      '/internal/audit/logs/by-actor',
      this.actors.fromUser(user, request, {
        departmentId: this.departmentId(query),
      }),
      query,
    );
  }

  private departmentId(query: Record<string, unknown>): string | undefined {
    return typeof query.departmentId === 'string'
      ? query.departmentId
      : undefined;
  }
}
