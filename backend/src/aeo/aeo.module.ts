import { Module } from '@nestjs/common';
import { AeoController } from './aeo.controller';
import { AeoService } from './aeo.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AeoController],
  providers: [AeoService],
  exports: [AeoService],
})
export class AeoModule {}
