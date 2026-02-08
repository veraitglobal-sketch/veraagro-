import { Module } from '@nestjs/common';
import { LogisticsPartnerController } from './logistics-partner.controller';
import { LogisticsPartnerService } from './logistics-partner.service';

@Module({
  controllers: [LogisticsPartnerController],
  providers: [LogisticsPartnerService],
  exports: [LogisticsPartnerService],
})
export class LogisticsPartnerModule {}
