import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  @Min(1)
  branchId: number;

  @IsInt()
  @Min(1)
  departmentId: number;

  @IsInt()
  @Min(1)
  serviceId: number;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerContact: string;

  @IsString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
