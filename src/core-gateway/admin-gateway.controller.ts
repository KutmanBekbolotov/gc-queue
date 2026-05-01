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

const ADMIN_RESOURCES = new Set([
  'branches',
  'departments',
  'categories',
  'services',
]);

@ApiTags('core admin')
@ApiBearerAuth()
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminGatewayController {
  constructor(
    private readonly gateway: CoreGatewayService,
    private readonly actors: CoreActorFactory,
  ) {}

  @ApiOperation({ summary: 'Proxy Spring core admin collection endpoint' })
  @ApiParam({
    name: 'resource',
    enum: ['branches', 'departments', 'categories', 'services'],
  })
  @ApiOkResponse({ description: 'Spring core admin response' })
  @HttpCode(200)
  @All(':resource')
  collection(
    @Param('resource') resource: string,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    this.assertResource(resource);

    return this.gateway.proxy(
      request,
      `/internal/admin/${resource}`,
      this.actors.fromUser(user, request),
    );
  }

  @ApiOperation({ summary: 'Proxy Spring core admin item endpoint' })
  @ApiParam({
    name: 'resource',
    enum: ['branches', 'departments', 'categories', 'services'],
  })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Spring core admin response' })
  @HttpCode(200)
  @All(':resource/:id')
  item(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    this.assertResource(resource);

    return this.gateway.proxy(
      request,
      `/internal/admin/${resource}/${encodeURIComponent(id)}`,
      this.actors.fromUser(user, request),
    );
  }

  @ApiOperation({
    summary: 'Proxy Spring core department-service assignment endpoint',
  })
  @ApiParam({ name: 'departmentId', type: String })
  @ApiParam({ name: 'serviceId', type: String })
  @ApiOkResponse({ description: 'Spring core department-service response' })
  @HttpCode(200)
  @All('departments/:departmentId/services/:serviceId')
  departmentService(
    @Param('departmentId') departmentId: string,
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.gateway.proxy(
      request,
      `/internal/admin/departments/${encodeURIComponent(
        departmentId,
      )}/services/${encodeURIComponent(serviceId)}`,
      this.actors.fromUser(user, request, { departmentId }),
    );
  }

  private assertResource(resource: string) {
    if (!ADMIN_RESOURCES.has(resource)) {
      throw new NotFoundException('Admin resource is not supported');
    }
  }
}
