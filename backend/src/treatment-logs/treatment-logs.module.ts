import { Module } from '@nestjs/common';
import { TreatmentLogsController } from './treatment-logs.controller';
import { TreatmentLogsService } from './treatment-logs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TreatmentLogsController],
  providers: [TreatmentLogsService],
  exports: [TreatmentLogsService],
})
export class TreatmentLogsModule {}
