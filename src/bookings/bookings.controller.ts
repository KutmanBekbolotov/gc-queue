import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingSlotsDto } from './dto/query-booking-slots.dto';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('slots')
  getAvailableSlots(@Query() query: QueryBookingSlotsDto) {
    return this.bookingsService.getAvailableSlots({
      ...query,
      branchId: Number(query.branchId),
      departmentId: Number(query.departmentId),
      serviceId: Number(query.serviceId),
    });
  }

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get(':id/qr')
  getQr(@Param('id') id: string) {
    return this.bookingsService.getQrPayload(Number(id));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const booking = this.bookingsService.findOne(Number(id));
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.bookingsService.confirm(Number(id));
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelBookingDto) {
    return this.bookingsService.cancel(Number(id), dto);
  }
}
