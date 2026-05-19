import { Module } from '@nestjs/common';
import { GrowthLogsService } from './growth-logs.service';
import { GrowthLogsController } from './growth-logs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AntiFraudModule } from '../anti-fraud/anti-fraud.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { TreatmentLogsModule } from '../treatment-logs/treatment-logs.module';
import { SmartLockModule } from '../smart-lock/smart-lock.module';

@Module({
  imports: [PrismaModule, AntiFraudModule, ComplianceModule, TreatmentLogsModule, SmartLockModule],
  providers: [GrowthLogsService],
  controllers: [GrowthLogsController],
  exports: [GrowthLogsService],
})
export class GrowthLogsModule {}
