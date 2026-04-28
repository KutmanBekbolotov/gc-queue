import { Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from '../bookings/bookings.service';
import { Public } from '../auth/decorators/public.decorator';
import { QrConsumeResponseDto } from './dto/qr-consume-response.dto';
import { QrInspectionDto } from './dto/qr-inspection.dto';

@ApiTags('qr')
@Controller('qr')
export class QrController {
  constructor(private readonly bookingsService: BookingsService) {}

  @ApiOperation({ summary: 'Inspect QR token' })
  @ApiParam({ name: 'token', example: '4f7a6a48-31cb-4eb8-8b3d-9e3d02977896' })
  @ApiOkResponse({ type: QrInspectionDto })
  @ApiNotFoundResponse({ description: 'QR token not found' })
  @Public()
  @Get(':token')
  inspect(@Param('token') token: string) {
    return this.bookingsService.inspectQr(token);
  }

  @ApiOperation({ summary: 'Consume QR token' })
  @ApiParam({ name: 'token', example: '4f7a6a48-31cb-4eb8-8b3d-9e3d02977896' })
  @ApiOkResponse({ type: QrConsumeResponseDto })
  @ApiBadRequestResponse({
    description: 'QR token is expired, cancelled, or already used',
  })
  @ApiNotFoundResponse({ description: 'QR token not found' })
  @Post(':token/consume')
  consume(@Param('token') token: string) {
    return this.bookingsService.consumeQr(token);
  }
}
