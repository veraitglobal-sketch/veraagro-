import { Module } from '@nestjs/common';
import { PlotMapperController } from './plot-mapper.controller';
import { PlotMapperService } from './plot-mapper.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlotMapperController],
  providers: [PlotMapperService],
  exports: [PlotMapperService],
})
export class PlotMapperModule {}
