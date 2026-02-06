import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('parcels')
@UseGuards(JwtAuthGuard)
export class ParcelsController {
  constructor(private parcelsService: ParcelsService) {}

  @Post('estate/:estateId')
  async create(
    @Param('estateId') estateId: string,
    @Body() body: { polygonCoordinates: any; cropType?: string },
    @Request() req: any,
  ) {
    return this.parcelsService.create(estateId, req.user.id, body);
  }

  @Get('estate/:estateId')
  async findAllByEstate(@Param('estateId') estateId: string, @Request() req: any) {
    return this.parcelsService.findAllByEstate(estateId, req.user.id);
  }
}
