import { IsBoolean, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateDepartmentDto {
  @IsInt()
  @Min(1)
  branchId: number;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
