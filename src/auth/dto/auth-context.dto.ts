import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuthContextDto {
  @ApiPropertyOptional({ example: '7f3d0d6c-37b8-4515-9c2b-cc6bb3d5ac02' })
  id?: string;

  @ApiPropertyOptional({ example: 'operator@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'operator' })
  username?: string;

  @ApiPropertyOptional({ example: 'Queue Operator' })
  fullName?: string;

  @ApiPropertyOptional({ example: 'OPERATOR' })
  role?: string;

  @ApiPropertyOptional({ example: ['OPERATOR'], type: [String] })
  roles?: string[];

  @ApiPropertyOptional({ example: ['queue:read'], type: [String] })
  scopes?: string[];
}
