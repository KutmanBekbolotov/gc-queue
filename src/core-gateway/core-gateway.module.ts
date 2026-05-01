import { Module } from '@nestjs/common';
import { AdminGatewayController } from './admin-gateway.controller';
import { CoreGatewayService } from './core-gateway.service';
import { ManagementGatewayController } from './management-gateway.controller';
import { ManagerDashboardGatewayController } from './manager-dashboard.controller';
import { OperatorGatewayController } from './operator.controller';
import { PublicBookingsGatewayController } from './public-bookings.controller';
import { PublicCatalogGatewayController } from './public-catalog.controller';
import { QrCoreGatewayController } from './qr-core.controller';
import { TerminalGatewayController } from './terminal.controller';
import { TvGatewayController } from './tv.controller';
import { TvSnapshotCacheService } from './tv-cache.service';

@Module({
  controllers: [
    AdminGatewayController,
    ManagementGatewayController,
    ManagerDashboardGatewayController,
    OperatorGatewayController,
    PublicBookingsGatewayController,
    PublicCatalogGatewayController,
    QrCoreGatewayController,
    TerminalGatewayController,
    TvGatewayController,
  ],
  providers: [CoreGatewayService, TvSnapshotCacheService],
})
export class CoreGatewayModule {}
