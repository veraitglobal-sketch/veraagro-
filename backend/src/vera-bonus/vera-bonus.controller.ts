import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { VeraBonusService } from './vera-bonus.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('vera-bonus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VeraBonusController {
  constructor(private readonly bonusService: VeraBonusService) {}

  /**
   * Calculate Vera Bonus for shipment
   * POST /vera-bonus/calculate
   */
  @Post('calculate')
  @Roles('GROWER', 'FARMER', 'COORDINATOR', 'SUPER_ADMIN', 'ADMIN')
  async calculateBonus(
    @Body() body: {
      shipmentId: string;
      isWashedAndSorted: boolean;
    },
  ) {
    return this.bonusService.calculateBonus(
      body.shipmentId,
      body.isWashedAndSorted,
    );
  }

  /**
   * Get bonus summary for farmer
   * GET /vera-bonus/summary/:farmerId
   */
  @Get('summary/:farmerId')
  @Roles('GROWER', 'FARMER', 'SUPER_ADMIN', 'ADMIN')
  async getBonusSummary(@Param('farmerId') farmerId: string) {
    return this.bonusService.getBonusSummary(farmerId);
  }
}
