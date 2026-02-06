import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveBlueprintDto } from './dto/plot-mapper.dto';

/**
 * Plot Mapper Service
 * Handles saving and retrieving plot blueprints
 */
@Injectable()
export class PlotMapperService {
  constructor(private prisma: PrismaService) {}

  /**
   * Save or update plot blueprint
   */
  async saveBlueprint(userId: string, dto: SaveBlueprintDto) {
    // Verify parcel ownership
    const parcel = await this.prisma.parcels.findUnique({
      where: { id: dto.parcelId },
      include: {
        estates: true,
      },
    });

    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }

    if (parcel.estates.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to edit this parcel');
    }

    // Calculate total area from zones
    const totalArea = dto.blueprintData.zones.reduce((sum, zone) => sum + zone.area, 0);

    // Check if blueprint exists
    const existing = await this.prisma.plot_blueprints.findUnique({
      where: { parcelId: dto.parcelId },
    });

    if (existing) {
      // Update existing blueprint
      return this.prisma.plot_blueprints.update({
        where: { id: existing.id },
        data: {
          blueprintData: dto.blueprintData as any,
        },
      });
    } else {
      // Create new blueprint
      return this.prisma.plot_blueprints.create({
        data: {
          id: crypto.randomUUID(),
          parcelId: dto.parcelId,
          blueprintData: dto.blueprintData as any,
        },
      });
    }
  }

  /**
   * Get blueprint by parcel ID
   */
  async getBlueprint(parcelId: string, userId: string) {
    const parcel = await this.prisma.parcels.findUnique({
      where: { id: parcelId },
      include: {
        estates: true,
        plot_blueprints: true,
      },
    });

    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }

    if (parcel.estates.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to view this parcel');
    }

    return parcel.plot_blueprints;
  }

  /**
   * Get all blueprints for an estate
   */
  async getBlueprintsByEstate(estateId: string, userId: string) {
    const estate = await this.prisma.estates.findUnique({
      where: { id: estateId },
      include: {
        parcels: {
          include: {
            plot_blueprints: true,
          },
        },
      },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    if (estate.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to view this estate');
    }

    return estate.parcels
      .filter((p) => p.plot_blueprints)
      .map((p) => p.plot_blueprints);
  }
}
