import { Module } from '@nestjs/common';
import { LogisticsPartnerController } from './logistics-partner.controller';
import { LogisticsPartnerService } from './logistics-partner.service';
import { LogisticsVehiclesController } from './logistics-vehicles.controller';
import { LogisticsVehiclesService } from './logistics-vehicles.service';
import { LogisticsDriversController } from './logistics-drivers.controller';
import { LogisticsDriversService } from './logistics-drivers.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LogisticsPartnerController, LogisticsVehiclesController, LogisticsDriversController],
  providers: [LogisticsPartnerService, LogisticsVehiclesService, LogisticsDriversService],
  exports: [LogisticsPartnerService, LogisticsVehiclesService, LogisticsDriversService],
})
export class LogisticsPartnerModule {}
