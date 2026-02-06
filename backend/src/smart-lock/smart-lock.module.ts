import { Module } from '@nestjs/common';
import { SmartLockService } from './smart-lock.service';
import { SmartLockController } from './smart-lock.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SeedsModule } from '../seeds/seeds.module';
import { ParcelsModule } from '../parcels/parcels.module';

@Module({
  imports: [PrismaModule, SeedsModule, ParcelsModule],
  providers: [SmartLockService],
  controllers: [SmartLockController],
  exports: [SmartLockService],
})
export class SmartLockModule {}
