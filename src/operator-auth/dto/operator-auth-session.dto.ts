import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OperatorAuthSessionDto {
  @ApiProperty({ example: 'c84f0d8e-e42a-40e6-8919-5a9a0dbd1684' })
  id: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: '2026-03-31T12:00:00.000Z' })
  expiresAt: Date;

  @ApiProperty({ example: '2026-03-24T12:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '127.0.0.1' })
  ip?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0' })
  userAgent?: string;

  @ApiPropertyOptional({ example: 'device-fingerprint-2f4d1a' })
  deviceFingerprint?: string;
}
