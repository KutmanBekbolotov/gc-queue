import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class OperatorLoginDto {
  @ApiProperty({
    example: 'operator',
    description: 'Username or email of the operator',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(128)
  login: string;

  @ApiProperty({
    example: 'ChangeMe_12345!',
    description: 'Operator password',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(256)
  password: string;

  @ApiPropertyOptional({
    example: 'device-fingerprint-2f4d1a',
    description: 'Optional client fingerprint used to bind the session',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  deviceFingerprint?: string;
}
