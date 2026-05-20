import { Module, forwardRef } from '@nestjs/common';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FreshnessService } from '../freshness/freshness.service';
import { AuditTrailModule } from '../audit-trail/audit-trail.module';
import { MaterialControlModule } from '../material-control/material-control.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BatchesModule } from '../batches/batches.module';

@Module({
  imports: [
    PrismaModule,
    AuditTrailModule,
    BatchesModule,
    forwardRef(() => MaterialControlModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [MissionsController],
  providers: [MissionsService, FreshnessService],
  exports: [MissionsService],
})
export class MissionsModule {}
