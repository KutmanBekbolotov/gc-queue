import { ApiProperty } from '@nestjs/swagger';

export class DepartmentServiceLink {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  departmentId: number;

  @ApiProperty({ example: 10 })
  serviceId: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: true })
  bookingEnabled: boolean;

  @ApiProperty({ example: true })
  terminalEnabled: boolean;

  @ApiProperty({ example: true })
  operatorEnabled: boolean;

  @ApiProperty({ example: 0 })
  priority: number;

  @ApiProperty({ example: '2026-03-23T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-23T12:00:00.000Z' })
  updatedAt: Date;
}
