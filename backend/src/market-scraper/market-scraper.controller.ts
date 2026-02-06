import { Controller, Post, Get, Query, UseGuards, Body } from '@nestjs/common';
import { MarketScraperService, MarginCalculation } from './market-scraper.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('market-scraper')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarketScraperController {
  constructor(private readonly scraperService: MarketScraperService) {}

  /**
   * MANUAL TRIGGER: Scrape prices from all retailers
   */
  @Post('scrape')
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  async triggerScrape() {
    return this.scraperService.triggerManualScrape();
  }

  /**
   * GET: Calculate real-time margin
   */
  @Get('margin')
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'BUYER')
  async calculateMargin(
    @Query('cropType') cropType: string,
    @Query('location') location: string = 'Hamburg',
    @Query('transportCost') transportCost?: number,
    @Query('fuelCost') fuelCost?: number,
  ): Promise<MarginCalculation> {
    return this.scraperService.calculateMargin(
      cropType,
      location,
      transportCost ? parseFloat(transportCost.toString()) : undefined,
      fuelCost ? parseFloat(fuelCost.toString()) : undefined
    );
  }

  /**
   * GET: Get price trends
   */
  @Get('trends')
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'BUYER')
  async getPriceTrends(
    @Query('cropType') cropType: string,
    @Query('location') location: string = 'Hamburg',
    @Query('days') days: string = '7',
  ) {
    return this.scraperService.getPriceTrends(cropType, location, parseInt(days, 10));
  }

  /**
   * GET: Get latest scraped prices
   */
  @Get('latest')
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'BUYER')
  async getLatestPrices(
    @Query('cropType') cropType?: string,
    @Query('location') location?: string,
  ) {
    return this.scraperService.getLatestPrices(cropType, location);
  }
}
