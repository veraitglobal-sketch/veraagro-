import { Module } from '@nestjs/common';
import { BatchHistoryService } from './batch-history.service';
import { BatchHistoryController } from './batch-history.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BatchHistoryController],
  providers: [BatchHistoryService],
  exports: [BatchHistoryService],
})
export class BatchHistoryModule {}
