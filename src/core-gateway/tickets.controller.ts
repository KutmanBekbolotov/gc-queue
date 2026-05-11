import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthRequestUser } from '../auth/auth.interfaces';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CoreActorFactory } from '../core/core-actor.factory';
import { EqueueCoreClient } from '../core/equeue-core.client';

@ApiTags('core tickets')
@ApiBearerAuth()
@Roles('OPERATOR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
@Controller('tickets')
export class TicketsGatewayController {
  constructor(
    private readonly core: EqueueCoreClient,
    private readonly actors: CoreActorFactory,
  ) {}

  @ApiOperation({ summary: 'Create Spring core ticket' })
  @ApiCreatedResponse({ description: 'Spring core ticket create response' })
  @Post()
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.core.post(
      '/internal/tickets',
      this.actors.fromUser(user, request, {
        departmentId: this.departmentId(body),
      }),
      body,
    );
  }

  @ApiOperation({ summary: 'List Spring core waiting tickets' })
  @ApiOkResponse({ description: 'Spring core waiting tickets response' })
  @Get('query/waiting')
  waiting(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.core.get(
      '/internal/tickets/query/waiting',
      this.actors.fromUser(user, request, {
        departmentId: this.departmentId(query),
      }),
      query,
    );
  }

  @ApiOperation({ summary: 'Get Spring core current operator ticket' })
  @ApiOkResponse({
    description: 'Spring core current operator ticket response',
  })
  @Get('query/operator/current')
  currentOperatorTicket(
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.core.get(
      '/internal/tickets/query/operator/current',
      this.actors.fromUser(user, request),
    );
  }

  @ApiOperation({ summary: 'Find Spring core ticket by number' })
  @ApiOkResponse({ description: 'Spring core ticket by number response' })
  @Get('query/by-number')
  byNumber(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.core.get(
      '/internal/tickets/query/by-number',
      this.actors.fromUser(user, request, {
        departmentId: this.departmentId(query),
      }),
      query,
    );
  }

  @ApiOperation({ summary: 'Get Spring core ticket history' })
  @ApiParam({ name: 'ticketId', type: String })
  @ApiOkResponse({ description: 'Spring core ticket history response' })
  @Get('query/:ticketId/history')
  history(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.core.get(
      `/internal/tickets/query/${encodeURIComponent(ticketId)}/history`,
      this.actors.fromUser(user, request),
    );
  }

  @ApiOperation({ summary: 'Get Spring core printable ticket by number' })
  @ApiOkResponse({ description: 'Spring core printable ticket response' })
  @Get('print')
  printByNumber(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.core.get(
      '/internal/tickets/print',
      this.actors.fromUser(user, request, {
        departmentId: this.departmentId(query),
      }),
      query,
    );
  }

  @ApiOperation({ summary: 'Get Spring core printable ticket by id' })
  @ApiParam({ name: 'ticketId', type: String })
  @ApiOkResponse({ description: 'Spring core printable ticket response' })
  @Get(':ticketId/print')
  printById(
    @Param('ticketId') ticketId: string,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.core.get(
      `/internal/tickets/${encodeURIComponent(ticketId)}/print`,
      this.actors.fromUser(user, request),
    );
  }

  private departmentId(source: Record<string, unknown>): string | undefined {
    return typeof source.departmentId === 'string'
      ? source.departmentId
      : undefined;
  }
}
