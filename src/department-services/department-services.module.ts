import { Module } from '@nestjs/common';
import { ServicesModule } from '../catalog/services.module';
import { DepartmentsModule } from '../departments/departments.module';
import { DepartmentServicesController } from './department-services.controller';
import { DepartmentServicesService } from './department-services.service';

@Module({
  imports: [ServicesModule, DepartmentsModule],
  providers: [DepartmentServicesService],
  controllers: [DepartmentServicesController],
  exports: [DepartmentServicesService],
})
export class DepartmentServicesModule {}
