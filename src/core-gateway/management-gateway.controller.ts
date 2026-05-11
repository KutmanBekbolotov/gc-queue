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

const MANAGEMENT_ITEM_PATHS: Record<string, string> = {
  employees: 'employees',
  halls: 'halls',
  windows: 'windows',
  terminals: 'terminals',
  'tv-devices': 'tv-devices',
  'reject-reasons': 'reject-reasons',
  'no-show-reasons': 'no-show-reasons',
};

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
    this.assertItemResource(resource);

    return this.gateway.proxy(
      request,
      `/internal/management/${MANAGEMENT_ITEM_PATHS[resource]}/${encodeURIComponent(
        id,
      )}`,
      this.actors.fromUser(user, request, { departmentId }),
    );
  }

  @ApiOperation({
    summary: 'Proxy Spring core employee-service assignment endpoint',
  })
  @ApiParam({ name: 'employeeId', type: String })
  @ApiParam({ name: 'serviceId', type: String })
  @ApiOkResponse({ description: 'Spring core employee-service response' })
  @HttpCode(200)
  @All('employees/:employeeId/services/:serviceId')
  employeeService(
    @Param('employeeId') employeeId: string,
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.gateway.proxy(
      request,
      `/internal/management/employees/${encodeURIComponent(
        employeeId,
      )}/services/${encodeURIComponent(serviceId)}`,
      this.actors.fromUser(user, request),
    );
  }

  @ApiOperation({
    summary: 'Proxy Spring core employee-window assignment endpoint',
  })
  @ApiParam({ name: 'employeeId', type: String })
  @ApiParam({ name: 'windowId', type: String })
  @ApiOkResponse({ description: 'Spring core employee-window response' })
  @HttpCode(200)
  @All('employees/:employeeId/windows/:windowId')
  employeeWindow(
    @Param('employeeId') employeeId: string,
    @Param('windowId') windowId: string,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
  ) {
    return this.gateway.proxy(
      request,
      `/internal/management/employees/${encodeURIComponent(
        employeeId,
      )}/windows/${encodeURIComponent(windowId)}`,
      this.actors.fromUser(user, request),
    );
  }

  private assertResource(resource: string) {
    if (!MANAGEMENT_RESOURCES.has(resource)) {
      throw new NotFoundException('Management resource is not supported');
    }
  }

  private assertItemResource(resource: string) {
    if (!MANAGEMENT_ITEM_PATHS[resource]) {
      throw new NotFoundException('Management item resource is not supported');
    }
  }
}
