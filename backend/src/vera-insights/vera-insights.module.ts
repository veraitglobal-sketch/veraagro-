import { Module } from '@nestjs/common';
import { VeraInsightsService } from './vera-insights.service';
import { VeraInsightsController } from './vera-insights.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VeraInsightsController],
  providers: [VeraInsightsService],
  exports: [VeraInsightsService],
})
export class VeraInsightsModule {}
