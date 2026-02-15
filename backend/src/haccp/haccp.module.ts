import { Module } from '@nestjs/common';
import { HaccpController } from './haccp.controller';
import { HaccpService } from './haccp.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HaccpController],
  providers: [HaccpService],
  exports: [HaccpService],
})
export class HaccpModule {}
