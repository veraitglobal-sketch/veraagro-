import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserStatus } from '@prisma/client';

@Injectable()
export class DistributorsService {
  private readonly logger = new Logger(DistributorsService.name);
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * OPTIMIZED: Get distributors for map (cached, <1s target)
   */
  async getDistributorsForMap(country?: string) {
    const cacheKey = `distributors:map:${country || 'all'}`;
    
    // Try cache first
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached && cached.expires > Date.now()) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cached.data;
    }

    // Retail / pickup points: system hubs (no manager) or hubs whose manager (buyer) is admin-approved.
    // Buyer self-registration is PENDING_VERIFICATION until approved — those hubs stay off the public map.
    const hubs = await this.prisma.hubs.findMany({
      where: {
        ...(country ? { city: { contains: country, mode: 'insensitive' } } : {}),
        OR: [
          { managerId: null },
          { users: { status: UserStatus.ACTIVE } },
        ],
      },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        status: true,
        location: true, // JSON with lat/lng
      },
      orderBy: {
        city: 'asc',
      },
    });

    // Transform to map format
    const distributors = hubs.map((hub) => {
      const location = hub.location as any;
      return {
        id: hub.id,
        name: hub.name,
        city: hub.city,
        address: hub.address,
        country: 'Germany', // Extract from address or add country field
        latitude: location?.lat || location?.latitude || 0,
        longitude: location?.lng || location?.longitude || 0,
        type: 'distribution_center', // Add type field to Hub model
        status: hub.status,
      };
    });

    // Cache result
    await this.cacheManager.set(cacheKey, {
      data: distributors,
      expires: Date.now() + this.CACHE_TTL * 1000,
    }, this.CACHE_TTL * 1000);

    return distributors;
  }
}
