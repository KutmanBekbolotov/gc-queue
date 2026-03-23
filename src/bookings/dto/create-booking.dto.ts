import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  branchId: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  departmentId: number;

  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  serviceId: number;

  @ApiProperty({ example: 'Ivan Petrov' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: '+77001234567' })
  @IsString()
  @IsNotEmpty()
  customerContact: string;

  @ApiProperty({ example: '2026-03-24T09:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiPropertyOptional({ example: 'Customer prefers morning visit' })
  @IsOptional()
  @IsString()
  notes?: string;
}
