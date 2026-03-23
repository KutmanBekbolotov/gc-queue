import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export class Booking {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  branchId: number;

  @ApiProperty({ example: 3 })
  departmentId: number;

  @ApiProperty({ example: 7 })
  serviceId: number;

  @ApiProperty({ example: 'Ivan Petrov' })
  customerName: string;

  @ApiProperty({ example: '+77001234567' })
  customerContact: string;

  @ApiProperty({ example: '2026-03-24T09:00:00.000Z' })
  scheduledAt: Date;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] })
  status: BookingStatus;

  @ApiProperty({ example: '4f7a6a48-31cb-4eb8-8b3d-9e3d02977896' })
  qrToken: string;

  @ApiProperty({ example: '2026-03-24T09:30:00.000Z' })
  qrExpiresAt: Date;

  @ApiPropertyOptional({ example: '2026-03-24T09:05:00.000Z' })
  qrUsedAt?: Date;

  @ApiPropertyOptional({ example: 'Customer cancelled by phone' })
  cancelReason?: string;

  @ApiPropertyOptional({ example: 'Customer prefers morning visit' })
  notes?: string;

  @ApiProperty({ example: '2026-03-23T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-23T12:00:00.000Z' })
  updatedAt: Date;
}
