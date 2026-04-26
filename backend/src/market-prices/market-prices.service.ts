import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarketPriceDto, UpdateMarketPriceDto } from './dto/market-price.dto';
import * as crypto from 'crypto';

@Injectable()
export class MarketPricesService {
  private readonly logger = new Logger(MarketPricesService.name);

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
    const cropType = (dto.cropType || '').trim();
    if (!cropType) {
      throw new BadRequestException('Crop type is required');
    }

    const effectiveFrom = dto.effectiveFrom
      ? new Date(dto.effectiveFrom)
      : new Date();
    if (Number.isNaN(effectiveFrom.getTime())) {
      throw new BadRequestException('Invalid effectiveFrom date');
    }

    let effectiveTo: Date | null = null;
    if (dto.effectiveTo != null && String(dto.effectiveTo).trim() !== '') {
      effectiveTo = new Date(dto.effectiveTo);
      if (Number.isNaN(effectiveTo.getTime())) {
        throw new BadRequestException('Invalid effectiveTo date');
      }
    }

    if (userId) {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) {
        throw new BadRequestException(
          'Session user is not linked to a database account. Log out and sign in again.',
        );
      }
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const buyPrice = Number(dto.buyPrice);
    const sellPrice = Number(dto.sellPrice);
    if (Number.isNaN(buyPrice) || Number.isNaN(sellPrice)) {
      throw new BadRequestException('Buy and sell price must be valid numbers');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.market_prices.updateMany({
          where: {
            cropType,
            isActive: true,
          },
          data: {
            isActive: false,
            effectiveTo: now,
          },
        });

        return tx.market_prices.create({
          data: {
            id,
            cropType,
            buyPrice,
            sellPrice,
            effectiveFrom,
            effectiveTo,
            setByUserId: userId || null,
            isActive: true,
            updatedAt: now,
          },
        });
      });
    } catch (e) {
      if (e instanceof PrismaClientValidationError) {
        this.logger.warn(`createPrice validation: ${e.message}`);
        throw new BadRequestException('Invalid market price data.');
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(
          `createPrice Prisma ${e.code}: ${e.message}`,
          e.meta,
        );
        if (e.code === 'P2003') {
          throw new BadRequestException(
            'Could not link this price to the current user. Try logging out and back in.',
          );
        }
        throw new InternalServerErrorException(
          'Could not save market price. Please try again.',
        );
      }
      throw e;
    }
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
