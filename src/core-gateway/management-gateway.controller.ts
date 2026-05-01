import {
  All,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
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
import { CoreGatewayService } from './core-gateway.service';

const MANAGEMENT_RESOURCES = new Set([
  'employees',
  'halls',
  'windows',
  'terminals',
  'tv-devices',
  'work-schedules',
  'reject-reasons',
  'no-show-reasons',
]);

@ApiTags('core management')
@ApiBearerAuth()
@Roles('MANAGER', 'ADMIN', 'SUPER_ADMIN')
@Controller('management')
export class ManagementGatewayController {
  constructor(
    private readonly gateway: CoreGatewayService,
    private readonly actors: CoreActorFactory,
  ) {}

  @ApiOperation({
    summary: 'Proxy Spring core department management collection endpoint',
  })
  @ApiParam({ name: 'departmentId', type: String })
  @ApiParam({
    name: 'resource',
    enum: [
      'employees',
      'halls',
      'windows',
      'terminals',
      'tv-devices',
      'work-schedules',
      'reject-reasons',
      'no-show-reasons',
    ],
  })
  @ApiOkResponse({ description: 'Spring core management response' })
  @HttpCode(200)
  @All('departments/:departmentId/:resource')
  collection(
    @Param('departmentId') departmentId: string,
    @Param('resource') resource: string,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    this.assertResource(resource);

    return this.gateway.proxy(
      request,
      `/internal/management/departments/${encodeURIComponent(
        departmentId,
      )}/${resource}`,
      this.actors.fromUser(user, request, { departmentId }),
    );
  }

  @ApiOperation({
    summary: 'Proxy Spring core department management item endpoint',
  })
  @ApiParam({ name: 'departmentId', type: String })
  @ApiParam({ name: 'resource', type: String })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Spring core management response' })
  @HttpCode(200)
  @All('departments/:departmentId/:resource/:id')
  item(
    @Param('departmentId') departmentId: string,
    @Param('resource') resource: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    this.assertResource(resource);

    return this.gateway.proxy(
      request,
      `/internal/management/departments/${encodeURIComponent(
        departmentId,
      )}/${resource}/${encodeURIComponent(id)}`,
      this.actors.fromUser(user, request, { departmentId }),
    );
  }

  private assertResource(resource: string) {
    if (!MANAGEMENT_RESOURCES.has(resource)) {
      throw new NotFoundException('Management resource is not supported');
    }
  }
}
