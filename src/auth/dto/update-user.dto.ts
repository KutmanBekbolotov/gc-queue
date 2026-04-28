import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'operator@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'Queue Operator' })
  fullName?: string;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  isBlocked?: boolean;

  @ApiPropertyOptional({ example: ['queue:read'], type: [String] })
  scopes?: string[];
}
