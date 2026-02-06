import { Module } from '@nestjs/common';
import { GroupSyncService } from './group-sync.service';
import { GroupSyncController } from './group-sync.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [GroupSyncService],
  controllers: [GroupSyncController],
  exports: [GroupSyncService],
})
export class GroupSyncModule {}
