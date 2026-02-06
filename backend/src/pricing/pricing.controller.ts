import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DynamicPricingService } from './dynamic-pricing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PricingController {
  constructor(private readonly pricingService: DynamicPricingService) {}

  /**
   * Calculate seed price for farmer
   * GET /pricing/seed-price
   * 
   * @param quantity Quantity in kg
   * @param seedType Optional seed type
   */
  @Get('seed-price')
  @Roles('GROWER', 'FARMER', 'SUPER_ADMIN', 'ADMIN')
  async calculateSeedPrice(
    @Query('quantity') quantity: string,
    @Query('seedType') seedType?: string,
    @GetUser() user?: { id: string },
    @Query('farmerId') farmerId?: string,
  ) {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Invalid quantity');
    }

    const targetFarmerId = farmerId || user?.id;
    if (!targetFarmerId) {
      throw new Error('Farmer ID required');
    }

    return this.pricingService.calculateSeedPrice(targetFarmerId, qty, seedType);
  }
}
