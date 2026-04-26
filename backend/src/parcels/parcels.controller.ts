import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('parcels')
export class ParcelsController {
  constructor(private parcelsService: ParcelsService) {}

  /**
   * Public: consumer / retail — plot passport (sadnja, tretmani, serije) — no auth.
   */
  @Get('public/plot/:code')
  async getPublicPlot(@Param('code') code: string) {
    return this.parcelsService.getPublicPlotData(code);
  }

  @Post('estate/:estateId')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('estateId') estateId: string,
    @Body() body: { polygonCoordinates: any; cropType?: string },
    @Request() req: any,
  ) {
    return this.parcelsService.create(estateId, req.user.id, body);
  }

  @Get('estate/:estateId')
  @UseGuards(JwtAuthGuard)
  async findAllByEstate(@Param('estateId') estateId: string, @Request() req: any) {
    return this.parcelsService.findAllByEstate(estateId, req.user.id);
  }

  /** Grower: PNG QR (data URL) for printing — one per parcel; links to /plot/{publicCode} */
  @Get(':id/qr')
  @UseGuards(JwtAuthGuard)
  async getPlotQr(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.parcelsService.getPlotQrDataUrlForOwner(id, req.user.id);
  }

  /** Admin: list parcels pending approval */
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async findAllPending() {
    return this.parcelsService.findAllPending();
  }

  /** Admin: approve parcel so farmer can work on the field and form batches */
  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async approve(@Param('id') id: string, @Request() req: any) {
    return this.parcelsService.approve(id, req.user.id);
  }
}
