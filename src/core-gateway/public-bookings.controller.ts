import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
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
import {
  CreatePublicBookingDto,
  PublicBookingSlotsQueryDto,
} from './dto/public-booking.dto';

@ApiTags('core public bookings')
@Public()
@Controller('public/bookings')
export class PublicBookingsGatewayController {
  constructor(
    private readonly core: EqueueCoreClient,
    private readonly actors: CoreActorFactory,
  ) {}

  @ApiOperation({ summary: 'Get Spring core public booking slots' })
  @ApiOkResponse({ description: 'Spring core booking slots response' })
  @Get('slots')
  slots(@Query() query: PublicBookingSlotsQueryDto, @Req() request: Request) {
    return this.core.get(
      '/internal/bookings/slots',
      this.actors.system(request, { departmentId: query.departmentId }),
      { ...query },
    );
  }

  @ApiOperation({ summary: 'Create Spring core public booking' })
  @ApiCreatedResponse({ description: 'Spring core booking create response' })
  @Post()
  create(@Body() body: CreatePublicBookingDto, @Req() request: Request) {
    return this.core.post(
      '/internal/bookings',
      this.actors.system(request, { departmentId: body.departmentId }),
      body,
    );
  }

  @ApiOperation({ summary: 'Get Spring core booking by confirmation code' })
  @ApiParam({ name: 'confirmationCode', type: String })
  @ApiOkResponse({ description: 'Spring core booking response' })
  @Get(':confirmationCode')
  findOne(
    @Param('confirmationCode') confirmationCode: string,
    @Req() request: Request,
  ) {
    return this.core.get(
      `/internal/bookings/${encodeURIComponent(confirmationCode)}`,
      this.actors.system(request),
    );
  }

  @ApiOperation({ summary: 'Confirm Spring core booking' })
  @ApiParam({ name: 'confirmationCode', type: String })
  @ApiOkResponse({ description: 'Spring core booking confirmation response' })
  @HttpCode(200)
  @Post(':confirmationCode/confirm')
  confirm(
    @Param('confirmationCode') confirmationCode: string,
    @Req() request: Request,
  ) {
    return this.core.post(
      `/internal/bookings/${encodeURIComponent(confirmationCode)}/confirm`,
      this.actors.system(request),
    );
  }

  @ApiOperation({ summary: 'Check in Spring core booking' })
  @ApiParam({ name: 'confirmationCode', type: String })
  @ApiOkResponse({ description: 'Spring core booking check-in response' })
  @HttpCode(200)
  @Post(':confirmationCode/check-in')
  checkIn(
    @Param('confirmationCode') confirmationCode: string,
    @Req() request: Request,
  ) {
    return this.core.post(
      `/internal/bookings/${encodeURIComponent(confirmationCode)}/check-in`,
      this.actors.system(request),
    );
  }

  @ApiOperation({ summary: 'Cancel Spring core booking' })
  @ApiParam({ name: 'confirmationCode', type: String })
  @ApiOkResponse({ description: 'Spring core booking cancellation response' })
  @HttpCode(200)
  @Post(':confirmationCode/cancel')
  cancel(
    @Param('confirmationCode') confirmationCode: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.core.post(
      `/internal/bookings/${encodeURIComponent(confirmationCode)}/cancel`,
      this.actors.system(request),
      body,
    );
  }
}
