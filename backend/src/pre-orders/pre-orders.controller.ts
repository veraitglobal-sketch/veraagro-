import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PreOrdersService } from './pre-orders.service';
import { CreatePreOrderDto, UpdatePreOrderStatusDto } from './dto';

@Controller('pre-orders')
export class PreOrdersController {
  constructor(private readonly service: PreOrdersService) {}

  /** Public: which season is open (web shows "Pre-order for <season> is open"). */
  @Get('config')
  config() {
    return this.service.config();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  create(@Request() req: any, @Body() dto: CreatePreOrderDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  listMine(@Request() req: any) {
    return this.service.listMine(req.user.id);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  listAll(@Query('season') season?: string, @Query('status') status?: string) {
    const s = Number(season);
    return this.service.listAll(Number.isInteger(s) ? s : undefined, status || undefined);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  updateStatus(@Request() req: any, @Param('id') id: string, @Body() dto: UpdatePreOrderStatusDto) {
    return this.service.updateStatus(req.user.id, id, dto);
  }
}
