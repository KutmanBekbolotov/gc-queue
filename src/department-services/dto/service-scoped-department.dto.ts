import { ApiProperty } from '@nestjs/swagger';
import { Department } from '../../departments/entities/department.entity';
import { DepartmentServiceLink } from '../entities/department-service.entity';

export class ServiceScopedDepartmentDto extends Department {
  @ApiProperty({ type: () => DepartmentServiceLink })
  departmentService: DepartmentServiceLink;
}
