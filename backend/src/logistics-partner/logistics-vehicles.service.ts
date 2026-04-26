import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import * as crypto from 'crypto';

@Injectable()
export class LogisticsVehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForPartner(logisticsPartnerId: string) {
    return this.prisma.vehicles.findMany({
      where: { logisticsPartnerId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createForPartner(logisticsPartnerId: string, dto: CreateVehicleDto) {
    const hasFrigo = dto.hasFrigo !== false;
    const tempRangeMin = dto.tempRangeMin ?? 0;
    const tempRangeMax = dto.tempRangeMax ?? 4;

    const existingPlate = await this.prisma.vehicles.findFirst({
      where: { licensePlate: dto.licensePlate.trim().toUpperCase() },
    });
    if (existingPlate) {
      throw new ConflictException('A vehicle with this license plate already exists.');
    }

    const vehicleNumber = `VEH-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    return this.prisma.vehicles.create({
      data: {
        id: crypto.randomUUID(),
        vehicleNumber,
        logisticsPartnerId,
        type: dto.type.trim(),
        make: dto.make?.trim() || null,
        model: dto.model?.trim() || null,
        licensePlate: dto.licensePlate.trim().toUpperCase(),
        hasFrigo,
        tempRangeMin,
        tempRangeMax,
        status: 'AVAILABLE',
        currentLocation: dto.currentLocation
          ? ({ lat: dto.currentLocation.lat, lng: dto.currentLocation.lng } as object)
          : null,
        updatedAt: new Date(),
      },
    });
  }
}
