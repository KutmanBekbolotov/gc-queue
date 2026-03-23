import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QrInspectionDto {
  @ApiProperty({ example: 1 })
  bookingId: number;

  @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] })
  status: string;

  @ApiProperty({ example: '2026-03-24T09:00:00.000Z' })
  scheduledAt: Date;

  @ApiProperty({ example: '2026-03-24T09:30:00.000Z' })
  qrExpiresAt: Date;

  @ApiPropertyOptional({ example: '2026-03-24T08:55:00.000Z' })
  qrUsedAt?: Date;

  @ApiProperty({ example: true })
  valid: boolean;
}
