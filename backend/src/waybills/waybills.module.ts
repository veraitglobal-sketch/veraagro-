import { Module } from '@nestjs/common';
import { WaybillsService } from './waybills.service';
import { WaybillsController } from './waybills.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WaybillsService],
  controllers: [WaybillsController],
  exports: [WaybillsService],
})
export class WaybillsModule {}
