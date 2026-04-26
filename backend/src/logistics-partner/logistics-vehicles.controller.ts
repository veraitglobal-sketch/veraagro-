import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LogisticsVehiclesService } from './logistics-vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Controller('logistics-partner/vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LOGISTICS_PARTNER')
export class LogisticsVehiclesController {
  constructor(private readonly logisticsVehiclesService: LogisticsVehiclesService) {}

  @Get()
  list(@Request() req: { user: { id: string } }) {
    return this.logisticsVehiclesService.listForPartner(req.user.id);
  }

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateVehicleDto) {
    return this.logisticsVehiclesService.createForPartner(req.user.id, dto);
  }
}
