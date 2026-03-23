import { Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module';
import { BranchesModule } from './branches/branches.module';
import { BookingsModule } from './bookings/bookings.module';
import { ServicesModule } from './catalog/services.module';
import { DepartmentsModule } from './departments/departments.module';
import { DepartmentServicesModule } from './department-services/department-services.module';
import { HealthModule } from './health/health.module';
import { QrModule } from './qr/qr.module';

@Module({
  imports: [
    AuditModule,
    HealthModule,
    BranchesModule,
    ServicesModule,
    DepartmentsModule,
    DepartmentServicesModule,
    BookingsModule,
    QrModule,
  ],
})
export class AppModule {}
