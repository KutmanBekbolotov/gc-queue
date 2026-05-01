import { Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module';
import { BranchesModule } from './branches/branches.module';
import { BookingsModule } from './bookings/bookings.module';
import { ServicesModule } from './catalog/services.module';
import { DepartmentsModule } from './departments/departments.module';
import { DepartmentServicesModule } from './department-services/department-services.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { QrModule } from './qr/qr.module';
import { CoreModule } from './core/core.module';
import { CoreGatewayModule } from './core-gateway/core-gateway.module';

@Module({
  imports: [
    AuditModule,
    HealthModule,
    AuthModule.register({
      baseUrl: process.env.AUTH_SERVICE_BASE_URL ?? 'http://10.11.13.61',
      timeoutMs: Number(process.env.AUTH_SERVICE_TIMEOUT_MS ?? 5000),
    }),
    CoreModule.register({
      baseUrl: process.env.EQUEUE_CORE_URL ?? 'http://localhost:8080/api',
      internalToken:
        process.env.EQUEUE_CORE_INTERNAL_TOKEN ?? 'change-me-dev-token',
      timeoutMs: Number(process.env.EQUEUE_CORE_TIMEOUT_MS ?? 10000),
    }),
    CoreGatewayModule,
    BranchesModule,
    ServicesModule,
    DepartmentsModule,
    DepartmentServicesModule,
    BookingsModule,
    QrModule,
  ],
})
export class AppModule {}
