import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SeedProductionService } from './seed-production.service';

@Controller('grower/seed-origin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('FARMER', 'GROWER')
export class SeedGrowerController {
  constructor(private service: SeedProductionService) {}

  @Get('parcel/:parcelId')
  parcelSeedOrigin(@Param('parcelId') parcelId: string, @Request() req: { user: { id: string } }) {
    return this.service.getGrowerParcelSeedOrigin(req.user.id, parcelId);
  }
}
