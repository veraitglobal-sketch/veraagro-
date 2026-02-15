import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { TreatmentLogsService } from './treatment-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('treatment-logs')
export class TreatmentLogsController {
  constructor(private readonly treatmentLogsService: TreatmentLogsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@GetUser() user: any, @Body() dto: any) {
    return this.treatmentLogsService.create(user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@GetUser() user: any, @Query('parcelId') parcelId?: string) {
    return this.treatmentLogsService.findByUser(user.id, parcelId);
  }

  @Get('parcel/:parcelId')
  @UseGuards(JwtAuthGuard)
  async findByParcel(@GetUser() user: any, @Param('parcelId') parcelId: string) {
    return this.treatmentLogsService.findByParcel(user.id, parcelId);
  }

  @Get('harvest-allowed/:parcelId')
  @UseGuards(JwtAuthGuard)
  async getEarliestHarvestDate(
    @GetUser() user: any,
    @Param('parcelId') parcelId: string,
  ) {
    const parcel = await this.treatmentLogsService['prisma'].parcels.findFirst({
      where: { id: parcelId, estates: { ownerId: user.id } },
    });
    if (!parcel) throw new (await import('@nestjs/common')).NotFoundException('Parcel not found');
    return this.treatmentLogsService.getEarliestHarvestDate(parcelId);
  }
}
