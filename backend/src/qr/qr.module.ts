import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QualityControlLevelsModule } from '../quality-control-levels/quality-control-levels.module';
import { PassportDocumentsModule } from '../passport-documents/passport-documents.module';

@Module({
  imports: [PrismaModule, QualityControlLevelsModule, PassportDocumentsModule],
  controllers: [QrController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
