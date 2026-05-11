import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthRequestUser } from '../auth/auth.interfaces';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CoreActorFactory } from '../core/core-actor.factory';
import { EqueueCoreClient } from '../core/equeue-core.client';

@ApiTags('core reports')
@ApiBearerAuth()
@Roles('AUDITOR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
@Controller('reports')
export class ReportsGatewayController {
  constructor(
    private readonly core: EqueueCoreClient,
    private readonly actors: CoreActorFactory,
  ) {}

  @ApiOperation({ summary: 'Download Spring core department load report' })
  @ApiOkResponse({
    description: 'Spring core XLSX department load report',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Get('department-load.xlsx')
  async departmentLoad(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthRequestUser,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const report = await this.core.getRaw(
      '/internal/reports/department-load.xlsx',
      this.actors.fromUser(user, request, {
        departmentId: this.departmentId(query),
      }),
      query,
    );

    response.status(report.status);
    response.setHeader(
      'Content-Type',
      report.contentType ??
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    if (report.contentDisposition) {
      response.setHeader('Content-Disposition', report.contentDisposition);
    }

    if (report.cacheControl) {
      response.setHeader('Cache-Control', report.cacheControl);
    }

    response.send(report.body);
  }

  private departmentId(query: Record<string, unknown>): string | undefined {
    return typeof query.departmentId === 'string'
      ? query.departmentId
      : undefined;
  }
}
