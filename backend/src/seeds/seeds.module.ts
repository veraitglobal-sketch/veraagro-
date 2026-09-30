import { Module, forwardRef } from '@nestjs/common';
import { SeedsService } from './seeds.service';
import { SeedsController } from './seeds.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SeedProductionModule } from '../seed-production/seed-production.module';

@Module({
  imports: [PrismaModule, forwardRef(() => SeedProductionModule)],
  providers: [SeedsService],
  controllers: [SeedsController],
  exports: [SeedsService],
})
export class SeedsModule {}
