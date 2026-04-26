import { Module } from '@nestjs/common';
import { HarvestAnnouncementsController } from './harvest-announcements.controller';
import { HarvestAnnouncementsService } from './harvest-announcements.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TreatmentLogsModule } from '../treatment-logs/treatment-logs.module';
import { MissionsModule } from '../missions/missions.module';

@Module({
  imports: [PrismaModule, NotificationsModule, TreatmentLogsModule, MissionsModule],
  controllers: [HarvestAnnouncementsController],
  providers: [HarvestAnnouncementsService],
  exports: [HarvestAnnouncementsService],
})
export class HarvestAnnouncementsModule {}
