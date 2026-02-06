import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQualityEntryDto, LogisticsHandoverDto } from './dto/quality-entry.dto';

@Injectable()
export class QualityEntryService {
  private readonly STANDARD_TRUCK_TEMP_MIN = 2; // °C
  private readonly STANDARD_TRUCK_TEMP_MAX = 8; // °C

  constructor(private prisma: PrismaService) {}

  /**
   * Create quality entry for a batch (Farmer's responsibility)
   */
  async createQualityEntry(userId: string, dto: CreateQualityEntryDto) {
    // Verify batch exists and belongs to user
    const batch = await this.prisma.batches.findUnique({
      where: { id: dto.batchId },
      include: {
        estates: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!batch) {
      throw new BadRequestException(`Batch ${dto.batchId} not found`);
    }

    // Verify user is the owner
    if (batch.estates.users.id !== userId) {
      throw new ForbiddenException('You can only create quality entries for your own batches');
    }

    // Verify standard confirmation is checked
    if (!dto.standardConfirmation) {
      throw new BadRequestException('Standard confirmation is required. You must confirm that Bio Vera packaging, film, and labels are applied according to the protocol.');
    }

    // Verify visual grade photos (must be 3)
    if (!dto.visualGradePhotos || dto.visualGradePhotos.length !== 3) {
      throw new BadRequestException('Exactly 3 visual grade photos are required (top, middle, bottom crates)');
    }

    // Check if quality entry already exists
    const existing = await this.prisma.quality_entries.findUnique({
      where: { batchId: dto.batchId },
    });

    if (existing) {
      throw new BadRequestException('Quality entry already exists for this batch');
    }

    // Create quality entry
    const qualityEntry = await this.prisma.quality_entries.create({
      data: {
        id: crypto.randomUUID(),
        batchId: dto.batchId,
        preCoolingStartTime: new Date(dto.preCoolingStartTime),
        weatherAtHarvest: dto.weatherAtHarvest as any,
        visualGradePhotos: dto.visualGradePhotos,
        standardConfirmation: dto.standardConfirmation,
        confirmedBy: userId,
        notes: dto.notes,
        status: 'COMPLETED',
        updatedAt: new Date(),
      },
    });

    // Update batch status to allow shipment creation
    await this.prisma.batches.update({
      where: { id: dto.batchId },
      data: {
        status: 'QUALITY_VERIFIED',
      },
    });

    // Create audit trail
    await this.prisma.audit_trails.create({
      data: {
        eventType: 'QUALITY_ENTRY',
        entityType: 'Batch',
        entityId: dto.batchId,
        newValue: {
          qualityEntryId: qualityEntry.id,
          preCoolingStartTime: dto.preCoolingStartTime,
          weatherAtHarvest: dto.weatherAtHarvest,
        } as any,
        changeReason: 'Farmer quality entry completed',
        isCompliant: true,
        timestamp: new Date(),
      } as any,
    });

    return qualityEntry;
  }

  /**
   * Logistics handover - Driver enters truck temperature before loading
   */
  async logisticsHandover(userId: string, dto: LogisticsHandoverDto) {
    // Verify mission exists
    const mission = await this.prisma.missions.findUnique({
      where: { id: dto.missionId },
      include: {
        batches: {
          include: {
            quality_entries: true,
          },
        },
        vehicles: true,
        users_missions_logisticsPartnerIdTousers: true,
      },
    });

    if (!mission) {
      throw new BadRequestException(`Mission ${dto.missionId} not found`);
    }

    // Verify user is the assigned logistics partner
    if (mission.logisticsPartnerId !== userId) {
      throw new ForbiddenException('You are not assigned to this mission');
    }

    // Verify quality entry exists
    if (!mission.batches?.quality_entries) {
      throw new BadRequestException('Quality entry must be completed before loading. Please wait for farmer to complete quality entry.');
    }

    // Check truck temperature against standard (2°C - 8°C)
    const isWithinStandard = 
      dto.insideTruckTemperature >= this.STANDARD_TRUCK_TEMP_MIN &&
      dto.insideTruckTemperature <= this.STANDARD_TRUCK_TEMP_MAX;

    if (!isWithinStandard) {
      throw new BadRequestException(
        `Truck temperature (${dto.insideTruckTemperature}°C) is outside standard range (${this.STANDARD_TRUCK_TEMP_MIN}°C - ${this.STANDARD_TRUCK_TEMP_MAX}°C). Loading is blocked. Please adjust temperature before proceeding.`
      );
    }

    // Create handover record
    const handover = await this.prisma.logistics_handovers.create({
      data: {
        id: crypto.randomUUID(),
        missionId: dto.missionId,
        insideTruckTemperature: dto.insideTruckTemperature,
        verifiedBy: userId,
        notes: dto.notes,
        status: 'APPROVED',
        timestamp: new Date(),
      },
    });

    // Update mission to allow loading
    await this.prisma.missions.update({
      where: { id: dto.missionId },
      data: {
        status: 'READY_FOR_LOADING',
      },
    });

    // Create initial temperature log
    await this.prisma.temperature_logs.create({
      data: {
        id: crypto.randomUUID(),
        missionId: dto.missionId,
        vehicleId: mission.vehicleId,
        batchId: mission.batchId,
        temperature: dto.insideTruckTemperature,
        humidity: 60, // Default
        location: {
          lat: 0,
          lng: 0,
        },
        reportedByUserId: userId,
        sensorId: 'MANUAL_ENTRY',
        deviceId: 'DRIVER_APP',
        isOutOfRange: false,
        timestamp: new Date(),
      },
    });

    // Create audit trail
    await this.prisma.audit_trails.create({
      data: {
        eventType: 'LOGISTICS_HANDOVER',
        entityType: 'Mission',
        entityId: dto.missionId,
        newValue: {
          handoverId: handover.id,
          insideTruckTemperature: dto.insideTruckTemperature,
        },
        changeReason: 'Driver verified truck temperature before loading',
        isCompliant: true,
        timestamp: new Date(),
      } as any,
    });

    return {
      success: true,
      handover,
      message: 'Truck temperature verified. Loading can proceed.',
    };
  }

  /**
   * Get quality entry for a batch
   */
  async getQualityEntry(batchId: string) {
    return this.prisma.quality_entries.findUnique({
      where: { batchId },
      include: {
        batches: {
          include: {
            estates: true,
          },
        },
      },
    });
  }

  /**
   * Check if batch can create shipment (quality entry completed)
   */
  async canCreateShipment(batchId: string): Promise<boolean> {
    const qualityEntry = await this.prisma.quality_entries.findUnique({
      where: { batchId },
    });

    return qualityEntry !== null && qualityEntry.status === 'COMPLETED';
  }
}
