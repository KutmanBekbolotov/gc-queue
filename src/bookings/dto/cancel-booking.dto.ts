import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelBookingDto {
  @ApiPropertyOptional({ example: 'Customer cancelled by phone' })
  @IsOptional()
  @IsString()
  reason?: string;
}
