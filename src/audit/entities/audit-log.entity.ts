import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLog {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiPropertyOptional({ example: '42' })
  actorId?: string;

  @ApiProperty({ example: 'SYSTEM' })
  actorType: string;

  @ApiPropertyOptional({ example: '127.0.0.1' })
  ip?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0' })
  userAgent?: string;

  @ApiPropertyOptional({ example: 'device-17' })
  deviceId?: string;

  @ApiProperty({ example: 'booking.created' })
  action: string;

  @ApiProperty({ example: 'Booking' })
  entityType: string;

  @ApiPropertyOptional({ example: '1001' })
  entityId?: string;

  @ApiPropertyOptional({ type: Object })
  beforeState?: unknown;

  @ApiPropertyOptional({ type: Object })
  afterState?: unknown;

  @ApiProperty({ example: '2026-03-23T12:00:00.000Z' })
  timestamp: Date;

  @ApiProperty({ example: 'corr-123' })
  correlationId: string;
}
