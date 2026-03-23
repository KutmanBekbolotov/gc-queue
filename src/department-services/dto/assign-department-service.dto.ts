import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class AssignDepartmentServiceDto {
  @IsInt()
  @Min(1)
  departmentId: number;

  @IsInt()
  @Min(1)
  serviceId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  bookingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  terminalEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  operatorEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
