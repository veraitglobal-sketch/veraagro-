import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { TreatmentLogsModule } from '../treatment-logs/treatment-logs.module';
import { SmartLockModule } from '../smart-lock/smart-lock.module';

@Module({
  imports: [PrismaModule, ComplianceModule, TreatmentLogsModule, SmartLockModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
