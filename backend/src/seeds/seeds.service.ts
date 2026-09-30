import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlantingCheckFailure, SeedProductionService } from '../seed-production/seed-production.service';

@Injectable()
export class SeedsService {
  constructor(
    private prisma: PrismaService,
    private seedProduction: SeedProductionService,
  ) {}

  async findBySerialNumber(serialNumber: string) {
    return this.prisma.seeds.findUnique({
      where: { serialNumber },
    });
  }

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

  async validateSeed(serialNumber: string, userId: string) {
    const check = await this.seedProduction.checkBagForPlanting(serialNumber, userId);
    if (check.ok) {
      return {
        valid: true,
        legacy: check.legacy,
        seed: check.seed,
        origin: check.origin,
      };
    }
    const failure = check as PlantingCheckFailure;
    if (failure.code === 'NOT_A_BIO_VERA_CODE') {
      throw new NotFoundException(failure.message);
    }
    if (failure.code === 'NOT_YOURS') {
      throw new ForbiddenException(failure.message);
    }
    throw new BadRequestException(failure.message);
  }
}
