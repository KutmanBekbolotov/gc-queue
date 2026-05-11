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

  @ApiPropertyOptional({ example: 'Queue Operator' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ enum: AuthRoleCode, example: AuthRoleCode.OPERATOR })
  @IsOptional()
  @IsEnum(AuthRoleCode)
  role?: AuthRoleCode;

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
