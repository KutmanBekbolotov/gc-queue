import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ServiceNodeType } from '../entities/service-node-type.enum';

export class CreateServiceDto {
  @ApiProperty({ example: 'OPEN_ACCOUNT' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Open Bank Account' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Opens a new retail account' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: ServiceNodeType,
    example: ServiceNodeType.CATEGORY,
    description: 'Defaults to CATEGORY when parentId is provided',
  })
  @IsOptional()
  @IsEnum(ServiceNodeType)
  type?: ServiceNodeType;

  @ApiPropertyOptional({
    example: 1,
    nullable: true,
    description: 'Parent catalog node. New root nodes are not allowed.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
