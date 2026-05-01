import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CoreActorFactory } from '../core/core-actor.factory';
import { EqueueCoreClient } from '../core/equeue-core.client';
import { TvSnapshotCacheService } from './tv-cache.service';

@ApiTags('core tv')
@Public()
@Controller('tv')
export class TvGatewayController {
  constructor(
    private readonly core: EqueueCoreClient,
    private readonly actors: CoreActorFactory,
    private readonly cache: TvSnapshotCacheService,
  ) {}

  @ApiOperation({ summary: 'Get Spring core TV snapshot by department' })
  @ApiOkResponse({ description: 'Spring core TV snapshot response' })
  @Get('snapshot')
  departmentSnapshot(
    @Query() query: Record<string, unknown>,
    @Req() request: Request,
  ) {
    const departmentId =
      typeof query.departmentId === 'string' ? query.departmentId : undefined;
    const actor = this.actors.device('TV', 'tv-snapshot', request, {
      departmentId,
    });
    const cacheKey = `department:${actor.language}:${JSON.stringify(query)}`;

    return this.cache.getOrLoad(cacheKey, () =>
      this.core.get('/internal/tv/snapshot', actor, query),
    );
  }

  @ApiOperation({ summary: 'Get Spring core TV snapshot by device code' })
  @ApiParam({ name: 'deviceCode', type: String })
  @ApiOkResponse({ description: 'Spring core TV snapshot response' })
  @Get(':deviceCode/snapshot')
  deviceSnapshot(
    @Param('deviceCode') deviceCode: string,
    @Req() request: Request,
  ) {
    const actor = this.actors.device('TV', deviceCode, request);
    const cacheKey = `device:${actor.language}:${deviceCode}`;

    return this.cache.getOrLoad(cacheKey, () =>
      this.core.get(
        `/internal/tv/${encodeURIComponent(deviceCode)}/snapshot`,
        actor,
      ),
    );
  }
}
