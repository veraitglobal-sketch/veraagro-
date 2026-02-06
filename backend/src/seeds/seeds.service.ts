import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeedsService {
  constructor(private prisma: PrismaService) {}

  async findBySerialNumber(serialNumber: string) {
    return this.prisma.seeds.findUnique({
      where: { serialNumber },
    });
  }

  /**
   * Get available seed batches for purchase
   */
  async getAvailableSeeds() {
    return this.prisma.seeds.findMany({
      where: {
        status: 'AVAILABLE',
        quantity: { gt: 0 },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Validate seed serial number for manual entry
   * Returns seed info if valid
   */
  async validateSeed(serialNumber: string, userId: string) {
    const seed = await this.prisma.seeds.findUnique({
      where: { serialNumber },
    });

    if (!seed) {
      throw new NotFoundException(`Seed with serial number ${serialNumber} not found`);
    }

    if (seed.status === 'USED' || seed.status === 'EXPIRED') {
      throw new BadRequestException(`Seed ${serialNumber} is already used or expired`);
    }

    // Optional: Check if seed is assigned to this user (if assignedToUserId exists)
    if (seed.assignedToUserId && seed.assignedToUserId !== userId) {
      throw new ForbiddenException('This seed is not assigned to you');
    }

    return {
      valid: true,
      seed: {
        id: seed.id,
        serialNumber: seed.serialNumber,
        name: seed.name,
        type: seed.type,
        batchNumber: seed.batchNumber,
        status: seed.status,
      },
    };
  }
}
