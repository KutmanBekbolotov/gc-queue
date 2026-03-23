import { ApiProperty } from '@nestjs/swagger';
import { ServiceNodeType } from './service-node-type.enum';

export class ServiceEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'OPEN_ACCOUNT' })
  code: string;

  @ApiProperty({ example: 'Open Bank Account' })
  name: string;

  @ApiProperty({ example: 'Opens a new retail account' })
  description: string;

  @ApiProperty({ enum: ServiceNodeType, example: ServiceNodeType.SERVICE })
  type: ServiceNodeType;

  @ApiProperty({ example: 1, nullable: true })
  parentId: number | null;

  @ApiProperty({ example: false })
  isSystem: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-03-23T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-23T12:00:00.000Z' })
  updatedAt: Date;
}
