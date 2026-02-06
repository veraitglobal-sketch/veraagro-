import { Module } from '@nestjs/common';
import { GrowthLogsService } from './growth-logs.service';
import { GrowthLogsController } from './growth-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AntiFraudModule } from '../anti-fraud/anti-fraud.module';

@Module({
  imports: [PrismaModule, AntiFraudModule],
  providers: [GrowthLogsService],
  controllers: [GrowthLogsController],
  exports: [GrowthLogsService],
})
export class GrowthLogsModule {}
