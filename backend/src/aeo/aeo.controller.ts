import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AeoService } from './aeo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('aeo')
export class AeoController {
  constructor(private readonly aeoService: AeoService) {}

  @Get('vehicle/:vehicleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COORDINATOR')
  async getBatchesByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.aeoService.getBatchesByVehicle(vehicleId);
  }

  @Get('export/:missionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COORDINATOR')
  async getAeoExportData(@Param('missionId') missionId: string) {
    return this.aeoService.getAeoExportData(missionId);
  }

  // Public endpoint for customs (with API key authentication in production)
  @Get('public/vehicle/:vehicleId')
  async getPublicBatchesByVehicle(@Param('vehicleId') vehicleId: string) {
    // In production, add API key authentication here
    return this.aeoService.getBatchesByVehicle(vehicleId);
  }
}
