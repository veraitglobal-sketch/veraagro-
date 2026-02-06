import { Module } from '@nestjs/common';
import { KillSwitchController } from './kill-switch.controller';
import { KillSwitchService } from './kill-switch.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [KillSwitchController],
  providers: [KillSwitchService],
  exports: [KillSwitchService],
})
export class KillSwitchModule {}
