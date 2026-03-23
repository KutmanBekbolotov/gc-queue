import { ApiProperty } from '@nestjs/swagger';

export class Branch {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'ALM' })
  code: string;

  @ApiProperty({ example: 'Almaty Central Branch' })
  name: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-03-23T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-23T12:00:00.000Z' })
  updatedAt: Date;
}
