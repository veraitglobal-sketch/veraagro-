import { Body, Controller, Get, Patch, Post, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LogisticsDriversService } from './logistics-drivers.service';
import { CreateLogisticsDriverDto, UpdateLogisticsDriverDto } from './dto/logistics-driver.dto';

@Controller('logistics-partner/drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LOGISTICS_PARTNER')
export class LogisticsDriversController {
  constructor(private readonly driversService: LogisticsDriversService) {}

  @Get()
  list(@Request() req: { user: { id: string } }) {
    return this.driversService.listForPartner(req.user.id);
  }

  @Post()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateLogisticsDriverDto) {
    return this.driversService.createForPartner(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateLogisticsDriverDto,
  ) {
    return this.driversService.updateForPartner(req.user.id, id, dto);
  }
}
