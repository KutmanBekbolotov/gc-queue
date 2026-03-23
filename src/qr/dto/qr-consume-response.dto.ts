import { ApiProperty } from '@nestjs/swagger';

export class QrConsumeResponseDto {
  @ApiProperty({ example: 1 })
  bookingId: number;

  @ApiProperty({ example: '2026-03-23T12:30:00.000Z' })
  consumedAt: Date;

  @ApiProperty({ example: true })
  valid: boolean;
}
