import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface ScrapedPrice {
  retailer: string; // "Edeka", "Rewe", "Alnatura"
  product: string; // "Bio Apfel", "Bio Weizen"
  price: number; // EUR per kg
  unit: string; // "kg", "100g", etc.
  location: string; // "Hamburg", "Berlin", etc.
  scrapedAt: Date;
  url?: string;
}

export interface MarginCalculation {
  cropType: string;
  marketPrice: number; // Scraped price from retailer
  ourBuyPrice: number; // Price we pay to grower
  transportCost: number; // EUR per kg
  fuelCost: number; // EUR per kg
  otherCosts: number; // EUR per kg (packaging, etc.)
  totalCost: number;
  margin: number; // EUR per kg
  marginPercentage: number; // %
  profitPerTon: number; // EUR per ton
}

export interface PriceAlert {
  cropType: string;
  retailer: string;
  location: string;
  previousPrice: number;
  currentPrice: number;
  priceChange: number; // EUR
  priceChangePercentage: number; // %
  alertType: 'SPIKE' | 'DROP' | 'STABLE';
  message: string;
}

@Injectable()
export class MarketScraperService {
  private readonly logger = new Logger(MarketScraperService.name);
  private readonly TARGET_PRODUCTS = [
    { name: 'Bio Apfel', cropType: 'Apple', keywords: ['bio apfel', 'bio äpfel', 'organic apple'] },
    { name: 'Bio Weizen', cropType: 'Wheat', keywords: ['bio weizen', 'bio weizenmehl', 'organic wheat'] },
  ];
  private readonly RETAILERS = [
    { name: 'Edeka', baseUrl: 'https://www.edeka.de' },
    { name: 'Rewe', baseUrl: 'https://www.rewe.de' },
    { name: 'Alnatura', baseUrl: 'https://www.alnatura.de' },
  ];

  // Default costs (can be configured)
  private readonly DEFAULT_TRANSPORT_COST = 0.15; // EUR per kg
  private readonly DEFAULT_FUEL_COST = 0.08; // EUR per kg
  private readonly DEFAULT_OTHER_COSTS = 0.05; // EUR per kg

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * SCHEDULED: Run every morning at 6:00 AM
   * Scrapes prices from German retailers
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async scheduledPriceScrape() {
    this.logger.log('Starting scheduled price scrape...');
    try {
      await this.scrapeAllPrices();
      this.logger.log('Scheduled price scrape completed');
    } catch (error) {
      this.logger.error('Error in scheduled price scrape:', error);
    }
  }

  /**
   * Scrape prices from all retailers
   */
  async scrapeAllPrices(): Promise<ScrapedPrice[]> {
    const allPrices: ScrapedPrice[] = [];

    for (const retailer of this.RETAILERS) {
      for (const product of this.TARGET_PRODUCTS) {
        try {
          const prices = await this.scrapeRetailerPrices(retailer.name, retailer.baseUrl, product);
          allPrices.push(...prices);
        } catch (error) {
          this.logger.error(`Error scraping ${retailer.name} for ${product.name}:`, error);
        }
      }
    }

    // Save scraped prices to database
    await this.saveScrapedPrices(allPrices);

    // Check for price changes and send alerts
    await this.checkPriceChanges(allPrices);

    return allPrices;
  }

  /**
   * Scrape prices from a specific retailer
   * Note: This is a simplified version. Real scraping would need:
   * - Puppeteer/Playwright for JavaScript-rendered pages
   * - HTML parsing with Cheerio
   * - API endpoints if available
   */
  private async scrapeRetailerPrices(
    retailer: string,
    baseUrl: string,
    product: { name: string; cropType: string; keywords: string[] }
  ): Promise<ScrapedPrice[]> {
    this.logger.log(`Scraping ${retailer} for ${product.name}...`);

    // NOTE: Real implementation would use:
    // 1. Puppeteer/Playwright for dynamic content
    // 2. Cheerio for HTML parsing
    // 3. Or API endpoints if available

    // For now, we'll use mock data structure
    // In production, replace with actual scraping logic

    try {
      // Example: Try to fetch product page
      const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(product.keywords[0])}`;
      
      // Mock response for demonstration
      // In production, use actual HTTP request and parsing
      const mockPrices: ScrapedPrice[] = [
        {
          retailer,
          product: product.name,
          price: this.generateMockPrice(product.cropType, retailer),
          unit: 'kg',
          location: 'Hamburg',
          scrapedAt: new Date(),
          url: searchUrl,
        },
      ];

      return mockPrices;
    } catch (error) {
      this.logger.error(`Error scraping ${retailer}:`, error);
      return [];
    }
  }

  /**
   * Generate mock price for demonstration
   * In production, this would be replaced with actual scraping
   */
  private generateMockPrice(cropType: string, retailer: string): number {
    // Base prices (EUR per kg)
    const basePrices: Record<string, number> = {
      Apple: 2.50,
      Wheat: 1.80,
    };

    const basePrice = basePrices[cropType] || 2.0;

    // Add retailer-specific variation
    const retailerMultipliers: Record<string, number> = {
      Edeka: 1.0,
      Rewe: 0.95,
      Alnatura: 1.15, // Premium organic
    };

    const multiplier = retailerMultipliers[retailer] || 1.0;

    // Add small random variation (±5%)
    const variation = 1 + (Math.random() - 0.5) * 0.1;

    return Math.round((basePrice * multiplier * variation) * 100) / 100;
  }

  /**
   * Save scraped prices to database
   * Note: Requires ScrapedPrice model in Prisma schema
   */
  private async saveScrapedPrices(prices: ScrapedPrice[]): Promise<void> {
    // Check if model exists (try-catch for graceful degradation)
    try {
      for (const price of prices) {
        await (this.prisma as any).scrapedPrice.create({
          data: {
            retailer: price.retailer,
            product: price.product,
            cropType: this.getCropTypeFromProduct(price.product),
            price: price.price,
            unit: price.unit,
            location: price.location,
            scrapedAt: price.scrapedAt,
            url: price.url,
          },
        });
      }

      this.logger.log(`Saved ${prices.length} scraped prices to database`);
    } catch (error: any) {
      if (error.code === 'P2001' || error.message?.includes('model') || error.message?.includes('does not exist')) {
        this.logger.warn('ScrapedPrice model not found. Add it to schema.prisma and run migration.');
        throw error;
      }
      throw error;
    }
  }

  /**
   * Check for price changes and send alerts
   */
  private async checkPriceChanges(newPrices: ScrapedPrice[]): Promise<void> {
    for (const newPrice of newPrices) {
      // Get previous price (yesterday's price)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const previousPrice = await (this.prisma as any).scrapedPrice.findFirst({
        where: {
          retailer: newPrice.retailer,
          product: newPrice.product,
          location: newPrice.location,
          scrapedAt: {
            gte: new Date(yesterday.setHours(0, 0, 0, 0)),
            lt: new Date(yesterday.setHours(23, 59, 59, 999)),
          },
        },
        orderBy: {
          scrapedAt: 'desc',
        },
      });

      if (previousPrice) {
        const priceChange = newPrice.price - previousPrice.price;
        const priceChangePercentage = (priceChange / previousPrice.price) * 100;

        // Alert if price change is significant (>5% or <-5%)
        if (Math.abs(priceChangePercentage) >= 5) {
          const alert = await this.createPriceAlert({
            cropType: this.getCropTypeFromProduct(newPrice.product),
            retailer: newPrice.retailer,
            location: newPrice.location,
            previousPrice: previousPrice.price,
            currentPrice: newPrice.price,
            priceChange,
            priceChangePercentage,
            alertType: priceChangePercentage > 0 ? 'SPIKE' : 'DROP',
            message: this.generateAlertMessage(newPrice, priceChangePercentage),
          });

          await this.sendPriceAlert(alert);
        }
      }
    }
  }

  /**
   * Create price alert
   */
  private async createPriceAlert(alert: PriceAlert): Promise<PriceAlert> {
    // Store alert in database (if model exists)
    try {
      await (this.prisma as any).priceAlert.create({
        data: {
          cropType: alert.cropType,
          retailer: alert.retailer,
          location: alert.location,
          previousPrice: alert.previousPrice,
          currentPrice: alert.currentPrice,
          priceChange: alert.priceChange,
          priceChangePercentage: alert.priceChangePercentage,
          alertType: alert.alertType,
          message: alert.message,
        },
      });
    } catch (error: any) {
      // If model doesn't exist, log warning but continue
      if (error.code === 'P2001' || error.message?.includes('model')) {
        this.logger.warn('PriceAlert model not found. Alert sent but not persisted.');
      } else {
        throw error;
      }
    }

    return alert;
  }

  /**
   * Send price alert notification to admins
   */
  private async sendPriceAlert(alert: PriceAlert): Promise<void> {
    // Get all admins and coordinators
    const admins = await this.prisma.users.findMany({
      where: {
        OR: [
          { roles: { has: 'SUPER_ADMIN' } },
          { roles: { has: 'ADMIN' } },
          { roles: { has: 'COORDINATOR' } },
        ],
      },
    });

    // Send notification to each admin
    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        type: 'ALERT',
        title: `💰 Price Alert: ${alert.cropType} in ${alert.location}`,
        message: alert.message,
        actionUrl: `/admin/market-prices?cropType=${alert.cropType}&location=${alert.location}`,
      });
    }

    this.logger.log(`Sent price alert to ${admins.length} admin(s): ${alert.message}`);
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(price: ScrapedPrice, changePercentage: number): string {
    const isSpike = changePercentage > 0;
    const absChange = Math.abs(changePercentage);

    if (isSpike && absChange >= 5) {
      return `Today the price of ${price.product} in ${price.location} (${price.retailer}) jumped ${absChange.toFixed(1)}%. Perfect time to send an extra truck!`;
    } else if (!isSpike && absChange >= 5) {
      return `Cena ${price.product} u ${price.location} (${price.retailer}) je pala ${absChange.toFixed(1)}%. Razmotri smanjenje zaliha.`;
    }

    return `Cena ${price.product} u ${price.location} se promenila za ${absChange.toFixed(1)}%.`;
  }

  /**
   * Calculate real-time margin
   */
  async calculateMargin(
    cropType: string,
    location: string = 'Hamburg',
    transportCost?: number,
    fuelCost?: number
  ): Promise<MarginCalculation> {
    // Get latest scraped price
    const latestPrice = await (this.prisma as any).scrapedPrice.findFirst({
      where: {
        cropType,
        location,
      },
      orderBy: {
        scrapedAt: 'desc',
      },
    });

    if (!latestPrice) {
      throw new Error(`No price data found for ${cropType} in ${location}`);
    }

    // Get our buy price (from MarketPrice)
    const ourPrice = await this.prisma.market_prices.findFirst({
      where: {
        cropType,
        isActive: true,
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
    });

    if (!ourPrice) {
      throw new Error(`No buy price found for ${cropType}`);
    }

    // Calculate costs
    const transport = transportCost || this.DEFAULT_TRANSPORT_COST;
    const fuel = fuelCost || this.DEFAULT_FUEL_COST;
    const other = this.DEFAULT_OTHER_COSTS;

    const totalCost = ourPrice.buyPrice + transport + fuel + other;
    const margin = latestPrice.price - totalCost;
    const marginPercentage = (margin / latestPrice.price) * 100;
    const profitPerTon = margin * 1000; // Convert to per ton

    return {
      cropType,
      marketPrice: latestPrice.price,
      ourBuyPrice: ourPrice.buyPrice,
      transportCost: transport,
      fuelCost: fuel,
      otherCosts: other,
      totalCost,
      margin,
      marginPercentage,
      profitPerTon,
    };
  }

  /**
   * Get price trends for a crop type
   */
  async getPriceTrends(
    cropType: string,
    location: string = 'Hamburg',
    days: number = 7
  ): Promise<Array<{ date: Date; price: number; retailer: string }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const prices = await (this.prisma as any).scrapedPrice.findMany({
      where: {
        cropType,
        location,
        scrapedAt: {
          gte: startDate,
        },
      },
      orderBy: {
        scrapedAt: 'asc',
      },
    });

    return prices.map((p) => ({
      date: p.scrapedAt,
      price: p.price,
      retailer: p.retailer,
    }));
  }

  /**
   * Helper: Get crop type from product name
   */
  private getCropTypeFromProduct(product: string): string {
    if (product.toLowerCase().includes('apfel') || product.toLowerCase().includes('apple')) {
      return 'Apple';
    }
    if (product.toLowerCase().includes('weizen') || product.toLowerCase().includes('wheat')) {
      return 'Wheat';
    }
    return 'Unknown';
  }

  /**
   * Manual trigger for price scraping (for testing)
   */
  async triggerManualScrape(): Promise<ScrapedPrice[]> {
    this.logger.log('Manual price scrape triggered');
    return this.scrapeAllPrices();
  }

  /**
   * Get latest prices for a crop type and location
   */
  async getLatestPrices(cropType?: string, location?: string): Promise<ScrapedPrice[]> {
    const where: any = {};
    if (cropType) {
      where.cropType = cropType;
    }
    if (location) {
      where.location = location;
    }

    const prices = await (this.prisma as any).scrapedPrice.findMany({
      where,
      orderBy: {
        scrapedAt: 'desc',
      },
      take: 50, // Latest 50 prices
    });

    return prices;
  }
}
