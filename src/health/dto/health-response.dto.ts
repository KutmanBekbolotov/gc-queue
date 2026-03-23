import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 'gc-queue-nest' })
  service: string;

  @ApiProperty({ example: '2026-03-23T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 1234 })
  uptimeSeconds: number;
}
