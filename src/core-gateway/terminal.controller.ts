import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CoreActorFactory } from '../core/core-actor.factory';
import { EqueueCoreClient } from '../core/equeue-core.client';
import { CreateTerminalTicketDto } from './dto/terminal-ticket.dto';

@ApiTags('core terminal')
@Public()
@Controller('terminal')
export class TerminalGatewayController {
  constructor(
    private readonly core: EqueueCoreClient,
    private readonly actors: CoreActorFactory,
  ) {}

  @ApiOperation({ summary: 'Create ticket from terminal through Spring core' })
  @ApiParam({ name: 'deviceCode', type: String })
  @ApiCreatedResponse({ description: 'Spring core terminal ticket response' })
  @Post(':deviceCode/tickets')
  createTicket(
    @Param('deviceCode') deviceCode: string,
    @Body() body: CreateTerminalTicketDto,
    @Req() request: Request,
  ) {
    return this.core.post(
      `/internal/terminal/${encodeURIComponent(deviceCode)}/tickets`,
      this.actors.device('TERMINAL', deviceCode, request, {
        departmentId: body.departmentId,
      }),
      body,
    );
  }

  @ApiOperation({ summary: 'Create terminal QR session through Spring core' })
  @ApiParam({ name: 'deviceCode', type: String })
  @ApiCreatedResponse({ description: 'Spring core QR session response' })
  @Post(':deviceCode/qr-sessions')
  createQrSession(
    @Param('deviceCode') deviceCode: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.core.post(
      `/internal/terminal/${encodeURIComponent(deviceCode)}/qr-sessions`,
      this.actors.device('TERMINAL', deviceCode, request),
      body,
    );
  }

  @ApiOperation({
    summary: 'Get terminal ticket print template from Spring core',
  })
  @ApiParam({ name: 'deviceCode', type: String })
  @ApiParam({ name: 'ticketId', type: String })
  @ApiOkResponse({ description: 'Spring core ticket print response' })
  @HttpCode(200)
  @Get(':deviceCode/tickets/:ticketId/print')
  printTicket(
    @Param('deviceCode') deviceCode: string,
    @Param('ticketId') ticketId: string,
    @Req() request: Request,
  ) {
    return this.core.get(
      `/internal/tickets/${encodeURIComponent(ticketId)}/print`,
      this.actors.device('TERMINAL', deviceCode, request),
    );
  }
}
