import { ApiProperty } from '@nestjs/swagger';

export class OperatorAuthTokensDto {
  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.operator-access-token-placeholder',
  })
  accessToken: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.operator-refresh-token-placeholder',
  })
  refreshToken: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;

  @ApiProperty({ example: 604800 })
  refreshExpiresIn: number;
}
