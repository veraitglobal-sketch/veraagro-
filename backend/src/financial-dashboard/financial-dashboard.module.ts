import { Module } from '@nestjs/common';
import { FinancialDashboardService } from './financial-dashboard.service';
import { FinancialDashboardController } from './financial-dashboard.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FinancialDashboardService],
  controllers: [FinancialDashboardController],
  exports: [FinancialDashboardService],
})
export class FinancialDashboardModule {}
