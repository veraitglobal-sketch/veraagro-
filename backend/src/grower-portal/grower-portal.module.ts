import { Module } from '@nestjs/common';
import { GrowerPortalService } from './grower-portal.service';
import { GrowerPortalController } from './grower-portal.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { QrModule } from '../qr/qr.module';

@Module({
  imports: [PrismaModule, QrModule],
  controllers: [GrowerPortalController],
  providers: [GrowerPortalService],
  exports: [GrowerPortalService],
})
export class GrowerPortalModule {}
