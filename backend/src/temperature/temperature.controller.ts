import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TemperatureService } from './temperature.service';
import { CreateTemperatureLogDto } from './dto/temperature.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('temperature')
@UseGuards(JwtAuthGuard)
export class TemperatureController {
  constructor(private readonly temperatureService: TemperatureService) {}

  @Post('log')
  @Roles('LOGISTICS_PARTNER')
  async logTemperature(@Request() req, @Body() dto: CreateTemperatureLogDto) {
    return this.temperatureService.logTemperature(req.user.id, dto);
  }

  @Get('batch/:batchId')
  @Roles('SUPER_ADMIN', 'COORDINATOR', 'GROWER', 'LOGISTICS_PARTNER')
  async getTemperatureHistory(@Param('batchId') batchId: string) {
    return this.temperatureService.getTemperatureHistory(batchId);
  }

  @Get('mission/:missionId')
  @Roles('SUPER_ADMIN', 'COORDINATOR', 'GROWER', 'LOGISTICS_PARTNER')
  async getMissionTemperatureHistory(@Param('missionId') missionId: string) {
    return this.temperatureService.getMissionTemperatureHistory(missionId);
  }

  @Get('alerts')
  @Roles('SUPER_ADMIN', 'COORDINATOR')
  async getTemperatureAlerts() {
    return this.temperatureService.getTemperatureAlerts();
  }
}
