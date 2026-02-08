import { Module } from '@nestjs/common';
import { QualityControlLevelsService } from './quality-control-levels.service';
import { QualityControlLevelsController } from './quality-control-levels.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QualityControlLevelsController],
  providers: [QualityControlLevelsService],
  exports: [QualityControlLevelsService],
})
export class QualityControlLevelsModule {}
