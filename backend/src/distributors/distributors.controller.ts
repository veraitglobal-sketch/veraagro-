import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DistributorsService } from './distributors.service.optimized';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('distributors')
export class DistributorsController {
  constructor(private readonly distributorsService: DistributorsService) {}

  /**
   * Public endpoint: Get retail locations where products can be purchased
   * No authentication required for map display
   */
  @Get('public/map')
  async getPublicRetailLocations(@Query('country') country?: string) {
    return this.distributorsService.getDistributorsForMap(country);
  }

  /**
   * OPTIMIZED: Get distributors for map (<1s target)
   * Cached, optimized query
   * Requires authentication
   */
  @Get('map')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'BUYER')
  async getDistributorsForMap(@Query('country') country?: string) {
    return this.distributorsService.getDistributorsForMap(country);
  }
}
