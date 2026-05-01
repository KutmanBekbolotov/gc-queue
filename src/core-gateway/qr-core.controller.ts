import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CoreActorFactory } from '../core/core-actor.factory';
import { EqueueCoreClient } from '../core/equeue-core.client';

@ApiTags('core qr')
@Public()
@Controller('qr')
export class QrCoreGatewayController {
  constructor(
    private readonly core: EqueueCoreClient,
    private readonly actors: CoreActorFactory,
  ) {}

  @ApiOperation({ summary: 'Validate Spring core QR session' })
  @ApiOkResponse({ description: 'Spring core QR session validation response' })
  @Get('sessions/validate')
  validateSession(@Query('token') token: string, @Req() request: Request) {
    return this.core.get(
      '/internal/qr/sessions/validate',
      this.actors.device('TERMINAL', 'qr-session', request),
      { token },
    );
  }

  @ApiOperation({ summary: 'Create ticket from Spring core QR session' })
  @ApiCreatedResponse({ description: 'Spring core QR ticket response' })
  @HttpCode(200)
  @Post('tickets')
  createTicket(@Body() body: Record<string, unknown>, @Req() request: Request) {
    return this.core.post(
      '/internal/qr/tickets',
      this.actors.device('TERMINAL', 'qr-session', request),
      body,
    );
  }
}
