import { Module } from '@nestjs/common';
import { MissionPassportController } from './mission-passport.controller';
import { MissionPassportService } from './mission-passport.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MissionPassportController],
  providers: [MissionPassportService],
  exports: [MissionPassportService],
})
export class MissionPassportModule {}
