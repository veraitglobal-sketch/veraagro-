import { Module } from '@nestjs/common';
import { VeraBonusService } from './vera-bonus.service';
import { VeraBonusController } from './vera-bonus.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VeraBonusController],
  providers: [VeraBonusService],
  exports: [VeraBonusService],
})
export class VeraBonusModule {}
