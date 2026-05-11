import { Controller, HttpCode, Post, Req } from '@nestjs/common';
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

@ApiTags('core maintenance')
@ApiBearerAuth()
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('maintenance')
export class MaintenanceGatewayController {
  constructor(
    private readonly core: EqueueCoreClient,
    private readonly actors: CoreActorFactory,
  ) {}

  @ApiOperation({ summary: 'Run Spring core maintenance jobs' })
  @ApiOkResponse({ description: 'Spring core maintenance response' })
  @HttpCode(200)
  @Post('run')
  run(@CurrentUser() user: AuthRequestUser, @Req() request: Request) {
    return this.core.request(
      'POST',
      '/internal/maintenance/run',
      this.actors.fromUser(user, request),
    );
  }
}
