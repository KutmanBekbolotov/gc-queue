import { Module } from '@nestjs/common';
import { BranchesModule } from '../branches/branches.module';
import { ServicesModule } from '../catalog/services.module';
import { DepartmentsModule } from '../departments/departments.module';
import { DepartmentServicesModule } from '../department-services/department-services.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [BranchesModule, DepartmentsModule, ServicesModule, DepartmentServicesModule],
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}
