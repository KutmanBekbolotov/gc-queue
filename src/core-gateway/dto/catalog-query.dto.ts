import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DepartmentServicesQueryDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000301' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;
}
