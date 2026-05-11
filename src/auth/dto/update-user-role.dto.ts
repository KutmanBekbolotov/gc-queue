import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AuthRoleCode } from '../auth.roles';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: AuthRoleCode, example: AuthRoleCode.ADMIN })
  @IsEnum(AuthRoleCode)
  role: AuthRoleCode;
}
