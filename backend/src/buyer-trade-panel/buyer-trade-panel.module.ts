import { Module } from '@nestjs/common';
import { BuyerTradePanelService } from './buyer-trade-panel.service';
import { BuyerTradePanelController } from './buyer-trade-panel.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BuyerTradePanelService],
  controllers: [BuyerTradePanelController],
  exports: [BuyerTradePanelService],
})
export class BuyerTradePanelModule {}
