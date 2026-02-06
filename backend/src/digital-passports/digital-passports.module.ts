import { Module } from '@nestjs/common';
import { DigitalPassportsService } from './digital-passports.service';
import { DigitalPassportsController } from './digital-passports.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DigitalPassportsService],
  controllers: [DigitalPassportsController],
  exports: [DigitalPassportsService],
})
export class DigitalPassportsModule {}
