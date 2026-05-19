import { Module } from '@nestjs/common';
import { TreatmentLogsController } from './treatment-logs.controller';
import { TreatmentLogsService } from './treatment-logs.service';
import { GrowthLogTreatmentSyncService } from './growth-log-treatment-sync.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TreatmentLogsController],
  providers: [TreatmentLogsService, GrowthLogTreatmentSyncService],
  exports: [TreatmentLogsService, GrowthLogTreatmentSyncService],
})
export class TreatmentLogsModule {}
