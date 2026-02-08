import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QualityControlLevelsModule } from '../quality-control-levels/quality-control-levels.module';

@Module({
  imports: [PrismaModule, QualityControlLevelsModule],
  controllers: [QrController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
