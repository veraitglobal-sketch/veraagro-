import { Module } from '@nestjs/common';
import { DynamicPricingService } from './dynamic-pricing.service';
import { DiscountQuotaService } from './discount-quota.service';
import { PricingController } from './pricing.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PricingController],
  providers: [DynamicPricingService, DiscountQuotaService],
  exports: [DynamicPricingService, DiscountQuotaService],
})
export class PricingModule {}
