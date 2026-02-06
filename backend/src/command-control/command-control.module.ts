import { Module } from '@nestjs/common';
import { CommandControlService } from './command-control.service';
import { CommandControlController } from './command-control.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TrustScoreModule } from '../trust-score/trust-score.module';

@Module({
  imports: [PrismaModule, NotificationsModule, TrustScoreModule],
  controllers: [CommandControlController],
  providers: [CommandControlService],
  exports: [CommandControlService],
})
export class CommandControlModule {}
