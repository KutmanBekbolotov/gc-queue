import { Module } from '@nestjs/common';
import { AdminGatewayController } from './admin-gateway.controller';
import { AnalyticsGatewayController } from './analytics.controller';
import { CoreAuditGatewayController } from './core-audit.controller';
import { CoreGatewayService } from './core-gateway.service';
import { MaintenanceGatewayController } from './maintenance.controller';
import { ManagementGatewayController } from './management-gateway.controller';
import { ManagerDashboardGatewayController } from './manager-dashboard.controller';
import { OperatorGatewayController } from './operator.controller';
import { PublicBookingsGatewayController } from './public-bookings.controller';
import { PublicCatalogGatewayController } from './public-catalog.controller';
import { QrCoreGatewayController } from './qr-core.controller';
import { ReportsGatewayController } from './reports.controller';
import { TerminalGatewayController } from './terminal.controller';
import { TicketsGatewayController } from './tickets.controller';
import { TvGatewayController } from './tv.controller';
import { TvSnapshotCacheService } from './tv-cache.service';

@Module({
  controllers: [
    AdminGatewayController,
    AnalyticsGatewayController,
    CoreAuditGatewayController,
    MaintenanceGatewayController,
    ManagementGatewayController,
    ManagerDashboardGatewayController,
    OperatorGatewayController,
    PublicBookingsGatewayController,
    PublicCatalogGatewayController,
    QrCoreGatewayController,
    ReportsGatewayController,
    TerminalGatewayController,
    TicketsGatewayController,
    TvGatewayController,
  ],
  providers: [CoreGatewayService, TvSnapshotCacheService],
})
export class CoreGatewayModule {}
