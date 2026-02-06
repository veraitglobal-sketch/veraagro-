import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MarketScraperService } from './market-scraper.service';
import { MarketScraperController } from './market-scraper.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, HttpModule, NotificationsModule],
  controllers: [MarketScraperController],
  providers: [MarketScraperService],
  exports: [MarketScraperService],
})
export class MarketScraperModule {}
