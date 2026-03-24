import { ApiProperty } from '@nestjs/swagger';
import { OperatorAuthenticatedUserDto } from './operator-authenticated-user.dto';
import { OperatorAuthSessionDto } from './operator-auth-session.dto';
import { OperatorAuthTokensDto } from './operator-auth-tokens.dto';

export class OperatorAuthResponseDto {
  @ApiProperty({ type: OperatorAuthenticatedUserDto })
  user: OperatorAuthenticatedUserDto;

  @ApiProperty({ type: OperatorAuthSessionDto })
  session: OperatorAuthSessionDto;

  @ApiProperty({ type: OperatorAuthTokensDto })
  tokens: OperatorAuthTokensDto;
}
