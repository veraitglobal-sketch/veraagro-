import { Module } from '@nestjs/common';
import { HarvestAnnouncementsController } from './harvest-announcements.controller';
import { HarvestAnnouncementsService } from './harvest-announcements.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [HarvestAnnouncementsController],
  providers: [HarvestAnnouncementsService],
  exports: [HarvestAnnouncementsService],
})
export class HarvestAnnouncementsModule {}
