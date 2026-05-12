import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { AuthRoleCode } from '../auth.roles';

export class CreateUserDto {
  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword_123!' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: 'operator' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    deprecated: true,
    description:
      'Use `username`. Accepted for compatibility and forwarded to Common Auth as `username`.',
    example: 'operator',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ enum: AuthRoleCode, example: AuthRoleCode.OPERATOR })
  @IsOptional()
  @IsEnum(AuthRoleCode)
  role?: AuthRoleCode;

  @ApiPropertyOptional({
    description:
      'Organization id. Required by business flow when ADMIN creates a MANAGER. Auto-filled from current MANAGER when MANAGER creates users.',
    example: '00000000-0000-0000-0000-000000000101',
  })
  @IsOptional()
  @IsString()
  ordId?: string;

  @ApiPropertyOptional({
    description:
      'Department id. Required by business flow when ADMIN creates a MANAGER. Auto-filled from current MANAGER when MANAGER creates users.',
    example: '00000000-0000-0000-0000-000000000301',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({
    deprecated: true,
    description:
      'Accepted by the gateway for compatibility, but not forwarded to Common Auth user create.',
    example: ['queue:read'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}
