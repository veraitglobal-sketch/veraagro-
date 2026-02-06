import { Module } from '@nestjs/common';
import { MaterialControlService } from './material-control.service';
import { MaterialControlController } from './material-control.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BatchesModule } from '../batches/batches.module';

@Module({
  imports: [PrismaModule, BatchesModule],
  controllers: [MaterialControlController],
  providers: [MaterialControlService],
  exports: [MaterialControlService],
})
export class MaterialControlModule {}
