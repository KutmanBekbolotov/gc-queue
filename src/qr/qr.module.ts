import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { QrController } from './qr.controller';

@Module({
  imports: [BookingsModule],
  controllers: [QrController],
})
export class QrModule {}
