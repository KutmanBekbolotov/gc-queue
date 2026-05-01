import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTerminalTicketDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000301' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000101' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000401' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: 'Иванов Иван', required: false })
  @IsOptional()
  @IsString()
  citizenFullName?: string;
}
