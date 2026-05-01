import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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

const TICKET_ACTIONS = new Set([
  'recall',
  'start',
  'complete',
  'no-show',
  'reject',
  'restore',
]);

@ApiTags('core operator')
@ApiBearerAuth()
@Roles('OPERATOR')
@Controller('operator')
export class OperatorGatewayController {
  constructor(
    private readonly core: EqueueCoreClient,
    private readonly actors: CoreActorFactory,
  ) {}

  @ApiOperation({ summary: 'Get Spring core operator dashboard' })
  @ApiOkResponse({ description: 'Spring core operator dashboard response' })
  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthRequestUser, @Req() request: Request) {
    return this.core.get(
      '/internal/operator/dashboard',
      this.actors.fromUser(user, request),
    );
  }

  @ApiOperation({ summary: 'Mark operator window available in Spring core' })
  @ApiOkResponse({ description: 'Spring core window availability response' })
  @HttpCode(200)
  @Post('window/available')
  available(
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.core.post(
      '/internal/operator/window/available',
      this.actors.fromUser(user, request),
      body,
    );
  }

  @ApiOperation({ summary: 'Mark operator window away in Spring core' })
  @ApiOkResponse({ description: 'Spring core window away response' })
  @HttpCode(200)
  @Post('window/away')
  away(
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.core.post(
      '/internal/operator/window/away',
      this.actors.fromUser(user, request),
      body,
    );
  }

  @ApiOperation({ summary: 'Take next ticket from Spring core' })
  @ApiOkResponse({ description: 'Spring core next ticket response' })
  @HttpCode(200)
  @Post('tickets/next')
  nextTicket(
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.core.post(
      '/internal/tickets/operator/next',
      this.actors.fromUser(user, request),
      body,
    );
  }

  @ApiOperation({ summary: 'List Spring core restorable tickets' })
  @ApiOkResponse({ description: 'Spring core restorable tickets response' })
  @Get('tickets/restorable')
  restorable(@CurrentUser() user: AuthRequestUser, @Req() request: Request) {
    return this.core.get(
      '/internal/tickets/restorable',
      this.actors.fromUser(user, request),
      request.query as Record<string, unknown>,
    );
  }

  @ApiOperation({ summary: 'Run Spring core operator ticket action' })
  @ApiParam({ name: 'ticketId', type: String })
  @ApiParam({
    name: 'action',
    enum: ['recall', 'start', 'complete', 'no-show', 'reject', 'restore'],
  })
  @ApiOkResponse({ description: 'Spring core ticket action response' })
  @HttpCode(200)
  @Post('tickets/:ticketId/:action')
  ticketAction(
    @Param('ticketId') ticketId: string,
    @Param('action') action: string,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
    @Body() body: Record<string, unknown>,
  ) {
    if (!TICKET_ACTIONS.has(action)) {
      throw new NotFoundException('Ticket action is not supported');
    }

    return this.core.post(
      `/internal/tickets/${encodeURIComponent(ticketId)}/${action}`,
      this.actors.fromUser(user, request),
      body,
    );
  }
}
