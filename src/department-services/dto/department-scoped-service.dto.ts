import { ApiProperty } from '@nestjs/swagger';
import { ServiceEntity } from '../../catalog/entities/service.entity';
import { DepartmentServiceLink } from '../entities/department-service.entity';

export class DepartmentScopedServiceDto extends ServiceEntity {
  @ApiProperty({ type: () => DepartmentServiceLink })
  departmentService: DepartmentServiceLink;
}
