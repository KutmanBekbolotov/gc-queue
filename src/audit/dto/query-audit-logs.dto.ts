import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryAuditLogsDto {
  @ApiPropertyOptional({ example: '42' })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional({ example: 'SYSTEM' })
  @IsOptional()
  @IsString()
  actorType?: string;

  @ApiPropertyOptional({ example: 'booking.created' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: 'Booking' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ example: '1001' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ example: 'corr-123' })
  @IsOptional()
  @IsString()
  correlationId?: string;
}
