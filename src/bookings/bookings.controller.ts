import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingSlotsDto } from './dto/query-booking-slots.dto';
import { QrPayloadDto } from '../qr/dto/qr-payload.dto';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @ApiOperation({ summary: 'Get available booking slots' })
  @ApiQuery({ name: 'branchId', example: 1, type: Number })
  @ApiQuery({ name: 'departmentId', example: 3, type: Number })
  @ApiQuery({ name: 'serviceId', example: 7, type: Number })
  @ApiQuery({ name: 'date', example: '2026-03-24', type: String })
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: { type: 'string', format: 'date-time', example: '2026-03-24T09:00:00.000Z' },
    },
  })
  @Get('slots')
  getAvailableSlots(@Query() query: QueryBookingSlotsDto) {
    return this.bookingsService.getAvailableSlots({
      ...query,
      branchId: Number(query.branchId),
      departmentId: Number(query.departmentId),
      serviceId: Number(query.serviceId),
    });
  }

  @ApiOperation({ summary: 'Create booking' })
  @ApiCreatedResponse({ type: Booking })
  @ApiBadRequestResponse({ description: 'Service is not available for booking in the selected department' })
  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @ApiOperation({ summary: 'List bookings' })
  @ApiOkResponse({ type: Booking, isArray: true })
  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @ApiOperation({ summary: 'Get QR payload for booking' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: QrPayloadDto })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @Get(':id/qr')
  getQr(@Param('id') id: string) {
    return this.bookingsService.getQrPayload(Number(id));
  }

  @ApiOperation({ summary: 'Get booking by id' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: Booking })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    const booking = this.bookingsService.findOne(Number(id));
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  @ApiOperation({ summary: 'Confirm booking' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: Booking })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.bookingsService.confirm(Number(id));
  }

  @ApiOperation({ summary: 'Cancel booking' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: Booking })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelBookingDto) {
    return this.bookingsService.cancel(Number(id), dto);
  }
}
