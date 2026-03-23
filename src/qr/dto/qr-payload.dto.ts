import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QrPayloadDto {
  @ApiProperty({ example: 1 })
  bookingId: number;

  @ApiProperty({ example: '4f7a6a48-31cb-4eb8-8b3d-9e3d02977896' })
  qrToken: string;

  @ApiProperty({ example: '2026-03-23T13:00:00.000Z' })
  qrExpiresAt: Date;

  @ApiPropertyOptional({ example: '2026-03-23T12:30:00.000Z' })
  qrUsedAt?: Date;

  @ApiProperty({ example: false })
  isExpired: boolean;

  @ApiProperty({ example: false })
  isUsed: boolean;
}
