import { Module } from '@nestjs/common';
import { BuyerTradePanelService } from './buyer-trade-panel.service';
import { BuyerTradePanelController } from './buyer-trade-panel.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, EmailModule, NotificationsModule],
  providers: [BuyerTradePanelService],
  controllers: [BuyerTradePanelController],
  exports: [BuyerTradePanelService],
})
export class BuyerTradePanelModule {}
