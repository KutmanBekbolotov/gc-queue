import { Controller, Get, HttpCode, Post, Query, Req } from '@nestjs/common';
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

@ApiTags('core analytics')
@ApiBearerAuth()
@Roles('AUDITOR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
@Controller('analytics')
export class AnalyticsGatewayController {
  constructor(
    private readonly core: EqueueCoreClient,
    private readonly actors: CoreActorFactory,
  ) {}

  @ApiOperation({ summary: 'Get Spring core department load analytics' })
  @ApiOkResponse({ description: 'Spring core department load response' })
  @Get('department-load')
  departmentLoad(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.core.get(
      '/internal/analytics/department-load',
      this.actors.fromUser(user, request, {
        departmentId: this.departmentId(query),
      }),
      query,
    );
  }

  @ApiOperation({ summary: 'Get Spring core operator stats analytics' })
  @ApiOkResponse({ description: 'Spring core operator stats response' })
  @Get('operator-stats')
  operatorStats(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.core.get(
      '/internal/analytics/operator-stats',
      this.actors.fromUser(user, request, {
        departmentId: this.departmentId(query),
      }),
      query,
    );
  }

  @ApiOperation({ summary: 'Get Spring core analytics summary' })
  @ApiOkResponse({ description: 'Spring core analytics summary response' })
  @Get('summary')
  summary(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.core.get(
      '/internal/analytics/summary',
      this.actors.fromUser(user, request, {
        departmentId: this.departmentId(query),
      }),
      query,
    );
  }

  @ApiOperation({ summary: 'Run Spring core analytics recalculation' })
  @ApiOkResponse({
    description: 'Spring core analytics recalculation response',
  })
  @HttpCode(200)
  @Post('recalculate')
  recalculate(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.core.request(
      'POST',
      '/internal/analytics/recalculate',
      this.actors.fromUser(user, request, {
        departmentId: this.departmentId(query),
      }),
      { params: query },
    );
  }

  private departmentId(query: Record<string, unknown>): string | undefined {
    return typeof query.departmentId === 'string'
      ? query.departmentId
      : undefined;
  }
}
