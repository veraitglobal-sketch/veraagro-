import { Module } from '@nestjs/common';
import { ExportAutomatorService } from './export-automator.service';
import { ExportAutomatorController } from './export-automator.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExportAutomatorController],
  providers: [ExportAutomatorService],
  exports: [ExportAutomatorService],
})
export class ExportAutomatorModule {}
