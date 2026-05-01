import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class PublicBookingSlotsQueryDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000301' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000401' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: '2026-05-01' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}

export class CreatePublicBookingDto {
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

  @ApiProperty({ example: '2026-05-01' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  bookingDate: string;

  @ApiProperty({ example: '09:00:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/)
  bookingTime: string;

  @ApiProperty({ example: 'Иванов Иван' })
  @IsString()
  @IsNotEmpty()
  citizenFullName: string;
}
