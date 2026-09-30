import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { SeedProductionService } from './seed-production.service';
import { SeedProductionController } from './seed-production.controller';
import { SeedProducerController } from './seed-producer.controller';
import { SeedGrowerController } from './seed-grower.controller';
import { SeedPublicController } from './seed-public.controller';

@Module({
  imports: [PrismaModule, NotificationsModule, EmailModule],
  providers: [SeedProductionService],
  controllers: [SeedProductionController, SeedProducerController, SeedGrowerController, SeedPublicController],
  exports: [SeedProductionService],
})
export class SeedProductionModule {}
