import { Module, forwardRef } from '@nestjs/common';
import { SmartLockService } from './smart-lock.service';
import { SmartLockController } from './smart-lock.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ParcelsModule } from '../parcels/parcels.module';
import { SeedProductionModule } from '../seed-production/seed-production.module';

@Module({
  imports: [PrismaModule, ParcelsModule, forwardRef(() => SeedProductionModule)],
  providers: [SmartLockService],
  controllers: [SmartLockController],
  exports: [SmartLockService],
})
export class SmartLockModule {}
