import { Module } from '@nestjs/common';
import { VeraTransparencyService } from './vera-transparency.service';
import { VeraTransparencyController } from './vera-transparency.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VeraTransparencyService],
  controllers: [VeraTransparencyController],
  exports: [VeraTransparencyService],
})
export class VeraTransparencyModule {}
