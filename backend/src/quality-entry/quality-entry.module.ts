import { Module } from '@nestjs/common';
import { QualityEntryService } from './quality-entry.service';
import { QualityEntryController } from './quality-entry.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BatchesModule } from '../batches/batches.module';
import { MissionsModule } from '../missions/missions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, BatchesModule, MissionsModule, NotificationsModule],
  controllers: [QualityEntryController],
  providers: [QualityEntryService],
  exports: [QualityEntryService],
})
export class QualityEntryModule {}
