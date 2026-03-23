import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class QueryBookingSlotsDto {
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
  date: string;
}
