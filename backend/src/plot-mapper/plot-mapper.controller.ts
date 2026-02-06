import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PlotMapperService } from './plot-mapper.service';
import { SaveBlueprintDto } from './dto/plot-mapper.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('plot-mapper')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlotMapperController {
  constructor(private readonly plotMapperService: PlotMapperService) {}

  @Post('save')
  @Roles('GROWER', 'FARMER')
  async saveBlueprint(@Body() dto: SaveBlueprintDto, @GetUser() user: any) {
    return this.plotMapperService.saveBlueprint(user.id, dto);
  }

  @Get('parcel/:parcelId')
  @Roles('GROWER', 'FARMER')
  async getBlueprint(@Param('parcelId') parcelId: string, @GetUser() user: any) {
    return this.plotMapperService.getBlueprint(parcelId, user.id);
  }

  @Get('estate/:estateId')
  @Roles('GROWER', 'FARMER')
  async getBlueprintsByEstate(@Param('estateId') estateId: string, @GetUser() user: any) {
    return this.plotMapperService.getBlueprintsByEstate(estateId, user.id);
  }
}
