import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketPriceDto, UpdateMarketPriceDto } from './dto/market-price.dto';
import * as crypto from 'crypto';

@Injectable()
export class MarketPricesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get current active price for a crop type
   */
  async getCurrentPrice(cropType: string) {
    const price = await this.prisma.market_prices.findFirst({
      where: {
        cropType,
        isActive: true,
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } },
        ],
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
    });

    if (!price) {
      throw new NotFoundException(`No active price found for crop type: ${cropType}`);
    }

    return price;
  }

  /**
   * Get all active prices
   */
  async getAllActivePrices() {
    return this.prisma.market_prices.findMany({
      where: {
        isActive: true,
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } },
        ],
      },
      orderBy: {
        cropType: 'asc',
      },
    });
  }

  /**
   * Create new market price (SuperAdmin only)
   */
  async createPrice(userId: string, dto: CreateMarketPriceDto) {
    // Deactivate old prices for this crop type
    await this.prisma.market_prices.updateMany({
      where: {
        cropType: dto.cropType,
        isActive: true,
      },
      data: {
        isActive: false,
        effectiveTo: new Date(),
      },
    });

    // Create new price
    return this.prisma.market_prices.create({
      data: {
        id: crypto.randomUUID(),
        ...dto,
        setByUserId: userId,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update market price (SuperAdmin only)
   */
  async updatePrice(userId: string, priceId: string, dto: UpdateMarketPriceDto) {
    const price = await this.prisma.market_prices.findUnique({
      where: { id: priceId },
    });

    if (!price) {
      throw new NotFoundException(`Price with ID ${priceId} not found`);
    }

    return this.prisma.market_prices.update({
      where: { id: priceId },
      data: {
        ...dto,
        setByUserId: userId,
      },
    });
  }

  /**
   * Get price history for a crop type
   */
  async getPriceHistory(cropType: string) {
    return this.prisma.market_prices.findMany({
      where: { cropType },
      orderBy: {
        effectiveFrom: 'desc',
      },
    });
  }
}
