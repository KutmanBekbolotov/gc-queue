import { Module } from '@nestjs/common';
import { AuditModule } from './audit/audit.module';
import { BranchesModule } from './branches/branches.module';
import { BookingsModule } from './bookings/bookings.module';
import { ServicesModule } from './catalog/services.module';
import { DepartmentsModule } from './departments/departments.module';
import { DepartmentServicesModule } from './department-services/department-services.module';
import { HealthModule } from './health/health.module';
import { InMemoryOperatorAuthUser } from './operator-auth/operator-auth.interfaces';
import { OperatorAuthModule } from './operator-auth/operator-auth.module';
import { QrModule } from './qr/qr.module';

function buildOperatorAuthSeedUsers(): InMemoryOperatorAuthUser[] {
  const username = process.env.OPERATOR_AUTH_BOOTSTRAP_USERNAME?.trim();
  const password = process.env.OPERATOR_AUTH_BOOTSTRAP_PASSWORD;

  if (!username || !password) {
    return [];
  }

  return [
    {
      username,
      password,
      fullName:
        process.env.OPERATOR_AUTH_BOOTSTRAP_FULL_NAME?.trim() ??
        'Bootstrap Operator',
      email: process.env.OPERATOR_AUTH_BOOTSTRAP_EMAIL?.trim(),
      roles: ['OPERATOR'],
      isActive: true,
      isBlocked: false,
    },
  ];
}

@Module({
  imports: [
    AuditModule,
    HealthModule,
    OperatorAuthModule.register({
      accessTokenSecret:
        process.env.JWT_ACCESS_SECRET ??
        'local-development-access-secret-change-before-production-01',
      refreshTokenSecret:
        process.env.JWT_REFRESH_SECRET ??
        'local-development-refresh-secret-change-before-production-02',
      accessTokenTtl: process.env.OPERATOR_AUTH_ACCESS_TTL ?? '15m',
      refreshTokenTtl: process.env.OPERATOR_AUTH_REFRESH_TTL ?? '7d',
      issuer: 'gc-queue-nest',
      audience: 'operator-ui',
      allowedRoleCodes: ['OPERATOR'],
      passwordPepper: process.env.OPERATOR_AUTH_PASSWORD_PEPPER,
      seedUsers: buildOperatorAuthSeedUsers(),
    }),
    BranchesModule,
    ServicesModule,
    DepartmentsModule,
    DepartmentServicesModule,
    BookingsModule,
    QrModule,
  ],
})
export class AppModule {}
