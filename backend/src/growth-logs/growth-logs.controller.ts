import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GrowthLogsService } from './growth-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('growth-logs')
@UseGuards(JwtAuthGuard)
export class GrowthLogsController {
  constructor(private growthLogsService: GrowthLogsService) {}

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.growthLogsService.create(req.user.id, body);
  }

  @Get('estate/:estateId')
  async findAllByEstate(@Param('estateId') estateId: string, @Request() req: any) {
    return this.growthLogsService.findAllByEstate(estateId, req.user.id);
  }

  @Get('parcel/:parcelId')
  async findAllByParcel(@Param('parcelId') parcelId: string, @Request() req: any) {
    return this.growthLogsService.findAllByParcel(parcelId, req.user.id);
  }
}
