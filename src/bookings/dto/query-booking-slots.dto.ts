import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class QueryBookingSlotsDto {
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

  @ApiProperty({ example: '2026-03-24' })
  @IsString()
  @IsNotEmpty()
  date: string;
}
