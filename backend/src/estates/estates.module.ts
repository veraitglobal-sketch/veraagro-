import { Module } from '@nestjs/common';
import { EstatesService } from './estates.service';
import { EstatesController } from './estates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EstatesService],
  controllers: [EstatesController],
  exports: [EstatesService],
})
export class EstatesModule {}
