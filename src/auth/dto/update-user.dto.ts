import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'operator@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

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

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional({
    description: 'Organization id for department-scoped users.',
    example: '00000000-0000-0000-0000-000000000101',
  })
  @IsOptional()
  @IsString()
  ordId?: string;

  @ApiPropertyOptional({
    description: 'Department id for department-scoped users.',
    example: '00000000-0000-0000-0000-000000000301',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({
    deprecated: true,
    description:
      'Accepted by the gateway for compatibility, but not forwarded to Common Auth user update.',
    example: ['queue:read'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}
