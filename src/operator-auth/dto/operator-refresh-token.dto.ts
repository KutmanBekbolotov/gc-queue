import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class OperatorRefreshTokenDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.operator-refresh-token-placeholder',
  })
  @IsString()
  @MaxLength(4000)
  refreshToken: string;

  @ApiPropertyOptional({
    example: 'device-fingerprint-2f4d1a',
    description:
      'Optional client fingerprint. If the session was bound to one, it must match.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  deviceFingerprint?: string;
}
