import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OperatorAuthenticatedUserDto {
  @ApiProperty({ example: '8ff3df54-68bd-4cb7-b3a8-96ed42d5bd34' })
  id: string;

  @ApiProperty({ example: 'operator' })
  username: string;

  @ApiProperty({ example: 'Main Hall Operator' })
  fullName: string;

  @ApiPropertyOptional({ example: 'operator@gc.local' })
  email?: string;

  @ApiProperty({
    example: ['OPERATOR'],
    isArray: true,
    type: String,
  })
  roles: string[];

  @ApiProperty({ example: 'c84f0d8e-e42a-40e6-8919-5a9a0dbd1684' })
  sessionId: string;

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, unknown>;
}
