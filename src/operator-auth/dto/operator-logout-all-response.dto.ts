import { ApiProperty } from '@nestjs/swagger';

export class OperatorLogoutAllResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 3 })
  revokedSessions: number;
}
