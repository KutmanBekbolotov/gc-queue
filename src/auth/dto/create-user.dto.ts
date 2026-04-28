import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'operator@example.com' })
  email: string;

  @ApiProperty({ example: 'StrongPassword_123!' })
  password: string;

  @ApiPropertyOptional({ example: 'Queue Operator' })
  fullName?: string;

  @ApiPropertyOptional({ example: 'OPERATOR' })
  role?: string;

  @ApiPropertyOptional({ example: ['queue:read'], type: [String] })
  scopes?: string[];
}
