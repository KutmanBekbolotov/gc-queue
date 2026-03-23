import { Controller, Get, Param, Post } from '@nestjs/common';
import { BookingsService } from '../bookings/bookings.service';

@Controller('qr')
export class QrController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get(':token')
  inspect(@Param('token') token: string) {
    return this.bookingsService.inspectQr(token);
  }

  @Post(':token/consume')
  consume(@Param('token') token: string) {
    return this.bookingsService.consumeQr(token);
  }
}
