import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { CoreActorFactory } from '../core/core-actor.factory';
import { EqueueCoreClient } from '../core/equeue-core.client';
import { DepartmentServicesQueryDto } from './dto/catalog-query.dto';

@ApiTags('core catalog')
@Public()
@Controller('catalog')
export class PublicCatalogGatewayController {
  constructor(
    private readonly core: EqueueCoreClient,
    private readonly actors: CoreActorFactory,
  ) {}

  @ApiOperation({ summary: 'List Spring core department services catalog' })
  @ApiOkResponse({ description: 'Spring core department services response' })
  @Get('department-services')
  departmentServices(
    @Query() query: DepartmentServicesQueryDto,
    @Req() request: Request,
  ) {
    return this.core.get(
      '/internal/catalog/department-services',
      this.actors.system(request, { departmentId: query.departmentId }),
      { ...query },
    );
  }
}
