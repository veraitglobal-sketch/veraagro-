import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LogisticsOptimizerService } from './logistics-optimizer.service';
import { LogisticsOptimizerController } from './logistics-optimizer.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [LogisticsOptimizerController],
  providers: [LogisticsOptimizerService],
  exports: [LogisticsOptimizerService],
})
export class LogisticsOptimizerModule {}
