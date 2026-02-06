import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BuyerTradePanelService } from './buyer-trade-panel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('buyer-trade-panel')
export class BuyerTradePanelController {
  constructor(private readonly tradePanelService: BuyerTradePanelService) {}

  /**
   * Live Supply & Demand Graph
   * Public endpoint - buyers can see supply vs demand
   */
  @Get('supply-demand')
  async getSupplyAndDemand() {
    return this.tradePanelService.getSupplyAndDemand();
  }

  /**
   * Real-Time Prices
   * Public endpoint - buyers can see current prices
   * Automatically checks and updates prices based on inventory
   */
  @Get('prices')
  async getRealTimePrices() {
    // Check and update prices if needed
    await this.tradePanelService.checkAndUpdatePricesBasedOnInventory();
    return this.tradePanelService.getRealTimePrices();
  }

  /**
   * Set Critical Threshold for product
   * Admin only - sets the stock level that triggers price increase
   */
  @Post('critical-threshold')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async setCriticalThreshold(
    @Body() body: { productName: string; threshold: number },
    @Request() req: any,
  ) {
    // Update the latest active price with critical threshold
    const latestPrice = await this.tradePanelService['prisma'].market_prices.findFirst({
      where: {
        cropType: body.productName,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!latestPrice) {
      throw new Error(`No active price found for ${body.productName}`);
    }

    // Update with critical threshold (stored in metadata)
    await this.tradePanelService['prisma'].market_prices.update({
      where: { id: latestPrice.id },
      data: {
        criticalThreshold: body.threshold,
      } as any,
    });

    return {
      success: true,
      productName: body.productName,
      criticalThreshold: body.threshold,
      message: `Critical threshold set to ${body.threshold} for ${body.productName}`,
    };
  }

  /**
   * Price Escalation Check
   * Admin only - checks for high demand
   */
  @Get('price-escalation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async checkPriceEscalation(@Param('productName') productName?: string) {
    return this.tradePanelService.checkPriceEscalation(productName);
  }

  /**
   * Apply Surge Pricing
   * Admin only - applies price increase
   */
  @Post('surge-pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async applySurgePricing(
    @Body() body: { productName: string; increasePercent: number },
    @Request() req: any,
  ) {
    return this.tradePanelService.applySurgePricing(
      body.productName,
      body.increasePercent,
      req.user.id,
    );
  }

  /**
   * Harvest Forecast (4 nedelje)
   * Buyers can see forecast
   */
  @Get('forecast')
  async getHarvestForecast(@Query('weeks') weeks?: string) {
    const weeksNumber = weeks ? parseInt(weeks, 10) : 4;
    return this.tradePanelService.getHarvestForecast(weeksNumber);
  }

  /**
   * Pre-Order & Lock Price
   * Buyers can create pre-orders
   */
  @Post('pre-order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BUYER')
  async createPreOrder(
    @Body()
    body: {
      productName: string;
      quantity: number;
      unit: string;
      requestedDeliveryDate: string;
      lockPrice: boolean;
    },
    @Request() req: any,
  ) {
    return this.tradePanelService.createPreOrder(
      req.user.id,
      body.productName,
      body.quantity,
      body.unit,
      new Date(body.requestedDeliveryDate),
      body.lockPrice,
    );
  }
}
